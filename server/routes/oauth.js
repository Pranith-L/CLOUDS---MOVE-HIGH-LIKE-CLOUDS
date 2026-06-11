import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const oauthRedirectBase = () =>
  (process.env.OAUTH_REDIRECT_BASE || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

const tokenForUser = (user) =>
  jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

const redirectOk = (res, token) =>
  res.redirect(`${clientUrl()}/auth/callback?token=${encodeURIComponent(token)}`);
const redirectFail = (res, msg) =>
  res.redirect(`${clientUrl()}/auth/callback?error=${encodeURIComponent(msg)}`);

router.get('/providers', (req, res) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    facebook: !!process.env.FACEBOOK_APP_ID && !!process.env.FACEBOOK_APP_SECRET,
    instagram: !!process.env.INSTAGRAM_APP_ID && !!process.env.INSTAGRAM_APP_SECRET
  });
});

// ─── Google ─────────────────────────────────────────
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !secret) return res.status(503).json({ message: 'Google sign-in is not configured.' });
  const redirectUri = `${oauthRedirectBase()}/api/oauth/google/callback`;
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`);
});

router.get('/google/callback', async (req, res) => {
  try {
    if (req.query.error) return redirectFail(res, String(req.query.error_description || req.query.error));
    const code = req.query.code;
    if (!code) return redirectFail(res, 'Missing authorization code');
    const redirectUri = `${oauthRedirectBase()}/api/oauth/google/callback`;
    const tokenBody = new URLSearchParams({
      code: String(code),
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody
    });
    const tokJson = await tokRes.json();
    if (!tokJson.access_token)
      return redirectFail(res, tokJson.error_description || tokJson.error || 'Google token exchange failed');
    const uiRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokJson.access_token}` }
    });
    const profile = await uiRes.json();
    const googleId = profile.id;
    const email = (profile.email || '').toLowerCase().trim();
    const name = profile.name || (email ? email.split('@')[0] : 'Reader');
    if (!googleId) return redirectFail(res, 'Google account did not return an id');
    let user = await User.findOne({ googleId });
    if (!user && email) user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email: email || `google_${googleId}@oauth.clouds.local`,
        googleId
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    return redirectOk(res, tokenForUser(user));
  } catch (e) {
    return redirectFail(res, e.message || 'Google sign-in failed');
  }
});

// ─── Facebook ──────────────────────────────────────
router.get('/facebook', (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !secret) return res.status(503).json({ message: 'Facebook sign-in is not configured.' });
  const redirectUri = `${oauthRedirectBase()}/api/oauth/facebook/callback`;
  const q = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'email,public_profile',
    response_type: 'code'
  });
  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${q}`);
});

router.get('/facebook/callback', async (req, res) => {
  try {
    if (req.query.error) return redirectFail(res, String(req.query.error_description || req.query.error));
    const code = req.query.code;
    if (!code) return redirectFail(res, 'Missing authorization code');
    const redirectUri = `${oauthRedirectBase()}/api/oauth/facebook/callback`;
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: String(code)
    })}`;
    const tokRes = await fetch(tokenUrl);
    const tokJson = await tokRes.json();
    if (!tokJson.access_token)
      return redirectFail(res, tokJson.error?.message || 'Facebook token exchange failed');
    const meUrl = `https://graph.facebook.com/me?${new URLSearchParams({
      fields: 'id,name,email',
      access_token: tokJson.access_token
    })}`;
    const meRes = await fetch(meUrl);
    const profile = await meRes.json();
    if (profile.error) return redirectFail(res, profile.error.message || 'Facebook profile failed');
    const facebookId = profile.id;
    const email = (profile.email || '').toLowerCase().trim();
    const name = profile.name || 'Reader';
    if (!facebookId) return redirectFail(res, 'Facebook account did not return an id');
    let user = await User.findOne({ facebookId });
    if (!user && email) user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email: email || `facebook_${facebookId}@oauth.clouds.local`,
        facebookId
      });
      await user.save();
    } else if (!user.facebookId) {
      user.facebookId = facebookId;
      await user.save();
    }
    return redirectOk(res, tokenForUser(user));
  } catch (e) {
    return redirectFail(res, e.message || 'Facebook sign-in failed');
  }
});

// ─── Instagram (Meta "Instagram API with Instagram Login") — Creator / Business accounts
router.get('/instagram', (req, res) => {
  const clientId = process.env.INSTAGRAM_APP_ID;
  const secret = process.env.INSTAGRAM_APP_SECRET;
  if (!clientId || !secret) return res.status(503).json({ message: 'Instagram sign-in is not configured.' });
  const redirectUri = `${oauthRedirectBase()}/api/oauth/instagram/callback`;
  const scope = process.env.INSTAGRAM_SCOPE || 'instagram_business_basic';
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope
  });
  res.redirect(`https://www.instagram.com/oauth/authorize?${q}`);
});

router.get('/instagram/callback', async (req, res) => {
  try {
    if (req.query.error) return redirectFail(res, String(req.query.error_description || req.query.error));
    const code = req.query.code;
    if (!code) return redirectFail(res, 'Missing authorization code');
    const redirectUri = `${oauthRedirectBase()}/api/oauth/instagram/callback`;
    const form = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: String(code)
    });
    const tokRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });
    const tokJson = await tokRes.json();
    const accessToken = tokJson.access_token || tokJson.data?.[0]?.access_token;
    const rawUserId = tokJson.user_id ?? tokJson.data?.[0]?.user_id;
    if (!accessToken || rawUserId == null)
      return redirectFail(res, typeof tokJson === 'object' ? JSON.stringify(tokJson) : 'Instagram token failed');
    const instagramId = String(rawUserId);
    const meUrl = `https://graph.instagram.com/me?${new URLSearchParams({
      fields: 'id,username',
      access_token: accessToken
    })}`;
    const meRes = await fetch(meUrl);
    const profile = await meRes.json();
    if (profile.error) return redirectFail(res, profile.error.message || 'Instagram profile failed');
    const username = profile.username || instagramId;
    const name = `${username} (Instagram)`;
    let user = await User.findOne({ instagramId });
    if (!user) {
      user = new User({
        name,
        email: `instagram_${instagramId}@oauth.clouds.local`,
        instagramId
      });
      await user.save();
    }
    return redirectOk(res, tokenForUser(user));
  } catch (e) {
    return redirectFail(res, e.message || 'Instagram sign-in failed');
  }
});

export default router;
