<template>
  <div class="box">
    <div class="container">
      <div class="title">{{$t('profile')}}</div>
      <div class="item">
        <div>{{$t('username')}}</div>
        <div>
          <span v-if="setNameShow" class="edit-name-input">
            <el-input v-model="accountName"  ></el-input>
            <span class="edit-name" @click="setName">
             {{$t('save')}}
            </span>
          </span>
          <span v-else class="user-name">
            <span >{{ userStore.user.name }}</span>
            <span class="edit-name" @click="showSetName">
             {{$t('change')}}
            </span>
          </span>
        </div>
      </div>
      <div class="item">
        <div>{{$t('emailAccount')}}</div>
        <div>{{ userStore.user.email }}</div>
      </div>
      <div class="item">
        <div>{{$t('password')}}</div>
        <div>
          <el-button type="primary" @click="pwdShow = true">{{$t('changePwdBtn')}}</el-button>
        </div>
      </div>
    </div>
    <div class="language">
      <div class="title">{{$t('language')}}</div>
      <el-select
          :model-value="langSelect"
          class="language-select"
          placeholder="Select"
          @change="changeLang"
      >
        <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
        <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
      </el-select>
    </div>
    <div class="oauth-bindings">
      <div class="title">{{$t('oauthBindings')}}</div>
      <div v-if="oauthList.length === 0" class="oauth-empty">{{$t('noOauthBindings')}}</div>
      <div v-else class="item" v-for="item in oauthList" :key="item.platform">
        <div>{{ platformName(item.platform) }} ({{ item.username }})</div>
        <div>
          <el-button type="danger" size="small" @click="confirmUnbind(item.platform)" :loading="unbindLoading === item.platform">{{$t('unbind')}}</el-button>
        </div>
      </div>
    </div>
    <div class="email-signature">
      <div class="title">{{$t('emailSignature')}}</div>
      <div class="signature-tip">{{$t('emailSignatureTip')}}</div>
      <div class="template-row">
        <span class="template-label">{{$t('signatureTemplate')}}:</span>
        <el-button v-for="tpl in signatureTemplates" :key="tpl.id" size="small"
                   @click="applyTemplate(tpl)">{{ tpl.name }}</el-button>
      </div>
      <tinyEditor :def-value="signatureDefValue" ref="signatureEditor" editor-id="signature-editor" />
      <div style="margin-top: 10px;">
        <el-button type="primary" @click="saveSignature" :loading="signatureSaving">{{$t('save')}}</el-button>
      </div>
    </div>
    <div class="del-email" v-perm="'my:delete'">
      <div class="title">{{$t('deleteUser')}}</div>
      <div style="color: var(--regular-text-color);">
        {{$t('delAccountMsg')}}
      </div>
      <div>
        <el-button type="primary" @click="deleteConfirm">{{$t('deleteUserBtn')}}</el-button>
      </div>
    </div>
    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="340">
      <div class="update-pwd">
        <el-input type="password" :placeholder="$t('newPassword')" v-model="form.password" autocomplete="off" @keyup.enter="submitPwd"/>
        <el-input type="password" :placeholder="$t('confirmPassword')" v-model="form.newPwd" autocomplete="off" @keyup.enter="submitPwd"/>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd">{{$t('save')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import {reactive, ref, defineOptions} from 'vue'
import {resetPassword, userDelete} from "@/request/my.js";
import {useUserStore} from "@/store/user.js";
import router from "@/router/index.js";
import {accountSetName} from "@/request/account.js";
import {useAccountStore} from "@/store/account.js";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/setting.js";

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const userStore = useUserStore();
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)

defineOptions({
  name: 'setting'
})

function showSetName() {
  accountName.value = userStore.user.name
  setNameShow.value = true
}

function setName() {

  if (!accountName.value) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameShow.value = false
  let name = accountName.value

  if (name === userStore.user.name) {
    return
  }

  userStore.user.name = accountName.value

  accountSetName(userStore.user.account.accountId,name).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })

    accountStore.changeUserAccountName = name

  }).catch(() => {
    userStore.user.name = name
  })
}

function changeLang(lang) {
  let setting = {}
  try {
    setting = JSON.parse(localStorage.getItem('setting') || '{}')
  } catch (e) {
    setting = {}
  }
  localStorage.setItem('setting', JSON.stringify({...setting, lang}))
  window.location.reload()
}

const pwdShow = ref(false)
const form = reactive({
  password: '',
  newPwd: '',
})

const deleteConfirm = () => {
  ElMessageBox.confirm(t('delAccountConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    userDelete().then(() => {
      localStorage.removeItem('token');
      router.replace('/login');
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  })
}


function submitPwd() {

  if (setPwdLoading.value) return

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password !== form.newPwd) {
    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    pwdShow.value = false
    setPwdLoading.value = false
    form.password = ''
    form.newPwd = ''
  }).catch(() => {
    setPwdLoading.value = false
  })

}

// OAuth 绑定管理
import {oauthMyBindings, oauthUnbind} from "@/request/ouath.js";
import {onMounted} from 'vue'

const oauthList = ref([])
const unbindLoading = ref('')

function platformName(platform) {
  const names = { github: 'GitHub', google: 'Google', linuxdo: 'LinuxDo' }
  return names[platform] || platform
}

function loadOauthBindings() {
  oauthMyBindings().then(data => {
    oauthList.value = data || []
  }).catch(() => {})
}

function confirmUnbind(platform) {
  ElMessageBox.confirm(t('unbindConfirm', { platform: platformName(platform) }), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    unbindLoading.value = platform
    oauthUnbind(platform).then(() => {
      ElMessage({
        message: t('unbindSuccessMsg'),
        type: 'success',
        plain: true,
      })
      loadOauthBindings()
    }).catch(() => {
    }).finally(() => {
      unbindLoading.value = ''
    })
  })
}

onMounted(() => {
  loadOauthBindings()
  loadSignature()
})

// 邮件签名
import tinyEditor from '@/components/tiny-editor/index.vue'
import { signatureTemplates } from '@/utils/signature-templates.js'

const signatureEditor = ref(null)
const signatureDefValue = ref('')
const signatureSaving = ref(false)
const SIGNATURE_KEY = 'mail_signature'

function applyTemplate(tpl) {
  ElMessageBox.confirm(t('applyTemplateConfirm', { name: tpl.name }), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'info'
  }).then(() => {
    signatureDefValue.value = ''
    setTimeout(() => { signatureDefValue.value = tpl.html })
  }).catch(() => {})
}

function loadSignature() {
  const saved = localStorage.getItem(SIGNATURE_KEY) || ''
  signatureDefValue.value = ''
  setTimeout(() => { signatureDefValue.value = saved })
}

function saveSignature() {
  if (signatureSaving.value) return
  signatureSaving.value = true
  const content = signatureEditor.value?.getContent() || ''
  localStorage.setItem(SIGNATURE_KEY, content)
  ElMessage({
    message: t('saveSuccessMsg'),
    type: 'success',
    plain: true,
  })
  signatureSaving.value = false
}

</script>
<style scoped lang="scss">
.box {
  padding: 40px 40px;

  @media (max-width: 767px) {
    padding: 30px 30px;
  }

  .update-pwd {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .title {
    font-size: 18px;
    font-weight: bold;
  }

  .container {
    font-size: 14px;
    display: grid;
    gap: 20px;
    margin-bottom: 40px;

    .item {
      display: grid;
      grid-template-columns: 50px 1fr;
      gap: 140px;
      position: relative;
      .user-name {
        display: grid;
        grid-template-columns: auto 1fr;
        span:first-child {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }

      .edit-name-input {
        position: absolute;
        bottom: -6px;
        .el-input {
          width: min(200px,calc(100vw - 222px));
        }
      }

      .edit-name {
        color: #4dabff;
        padding-left: 10px;
        cursor: pointer;
      }

      @media (max-width: 767px) {
        gap: 70px;
      }

      div:first-child {
        font-weight: bold;
      }

      div:last-child {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }

  .language {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 40px;

    .language-select {
      width: 100px;
    }
  }

  .del-email {
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .oauth-bindings {
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 40px;

    .title {
      font-weight: bold;
    }

    .oauth-empty {
      color: var(--regular-text-color);
    }

    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .email-signature {
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 40px;

    .title {
      font-weight: bold;
    }

    .signature-tip {
      color: var(--regular-text-color);
      font-size: 13px;
    }

    .template-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .template-label {
        font-size: 13px;
        color: var(--regular-text-color);
      }
    }
  }
}
</style>
