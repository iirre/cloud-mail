import app from '../hono/hono';
import result from "../model/result";
import oauthService from "../service/oauth-service";
import userContext from '../security/user-context';

app.post('/oauth/linuxDo/login', async (c) => {
	const loginInfo = await oauthService.linuxDoLogin(c, await c.req.json());
	return c.json(result.ok(loginInfo))
});

app.post('/oauth/github/login', async (c) => {
	const loginInfo = await oauthService.githubLogin(c, await c.req.json());
	return c.json(result.ok(loginInfo))
});

app.post('/oauth/google/login', async (c) => {
	const loginInfo = await oauthService.googleLogin(c, await c.req.json());
	return c.json(result.ok(loginInfo))
});

app.put('/oauth/bindUser', async (c) => {
	const loginInfo = await oauthService.bindUser(c, await c.req.json());
	return c.json(result.ok(loginInfo))
})

app.get('/oauth/my', async (c) => {
	const list = await oauthService.listByUserId(c, userContext.getUserId(c));
	return c.json(result.ok(list))
})

app.delete('/oauth/unbind', async (c) => {
	await oauthService.unbind(c, userContext.getUserId(c), c.req.query().platform);
	return c.json(result.ok())
})
