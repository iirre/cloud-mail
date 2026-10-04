import http from '@/axios/index.js';

export function oauthLinuxDoLogin(code, redirectUri) {
    return http.post('/oauth/linuxDo/login',{code, redirectUri})
}

export function oauthGithubLogin(code, redirectUri) {
    return http.post('/oauth/github/login',{code, redirectUri})
}

export function oauthGoogleLogin(code, redirectUri) {
    return http.post('/oauth/google/login',{code, redirectUri})
}

export function oauthBindUser(form) {
    return http.put('/oauth/bindUser', form)
}

export function oauthMyBindings() {
    return http.get('/oauth/my')
}

export function oauthUnbind(platform) {
    return http.delete('/oauth/unbind', { params: { platform } })
}
