import store from '../stores/store';
import axios from 'axios';
import DeviceStorage from 'react-device-storage';
import {Auth} from "aws-amplify";

axios.defaults.baseURL = store.api;
axios.defaults.headers.common['Content-Type'] = 'application/json; charset=UTF-8';

const refreshToken = async (callback) => {
    console.log('refreshToken Method');
    const S = new DeviceStorage().localStorage();
    const refreshToekn = S.read('refreshToken') || store.auth.refreshToken;
    await axios
        .post(`/token/refresh`, {refreshToken: refreshToekn})
        .then((response) => {
            if (response.status === 200) {

                S.save('token', response.data.accessToken);
                store.auth = {
                    ...store.auth,
                    token: response.data.accessToken,
                };

                callback(response);
            }
        })
        .catch((error) => {
            S.delete('token');
            S.delete('location');
            window.location.reload('/login');
        });
}

axios.interceptors.request.use(
    function (config) {

        const S = new DeviceStorage().localStorage();
        if (!config.url.includes('/login') && !config.url.includes('/api/kolonbenit') && (S.read('token') !== undefined || store.auth.token !== undefined && store.auth.token !== '')) {
            if (
                config.url.startsWith('/placement/customer/images') ||
                config.url.startsWith('/community/notice/image') ||
                config.url.startsWith('/community/feed/image') ||
                config.url.startsWith('/community/faq/image') ||
                config.url.startsWith('/community/qna/image') ||
                config.url.startsWith('/community/reservation/image') ||
                config.url.startsWith('/community/vote/image') ||
                config.url.startsWith('/files')

            ) {
                // img upload시 content-type을 form-data로 보내야 함.
                axios.defaults.headers.common['Content-Type'] = 'multipart/form-data';
            }
            config.headers.Authorization = 'Bearer ' + S.read('token') || store.auth.token;
        }
        return config;
    },

    function (error) {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    function (response) {
        return response;
    },

    function (error) {
        if (error.response !== undefined) {
            if (error.response.status === 401) {
                if (window.location.href.indexOf('/login') < 0) {
                    /*refreshToken((response) => {
                        if (response.status === 200) {
                            console.log(response);
                            window.location.reload();
                        }
                    });*/
                } else if (error.response.data.message === 'Unauthorized') {
                    return error.response;
                }
            } else if (error.response.status === 409) {
                store.alert('중복 된 데이터가 있습니다.\n관리자에게 문의하세요.');
            }
        }

        return Promise.reject(error);
    }
);

const getUserInfo = async (callback) => {
    await axios
        .get(`/me`)
        .then((response) => {
            callback(response);
        })
        .catch((error) => {
            console.log('error : ' + JSON.stringify(error));
        });
};

const dataURLtoBlob = (dataurl) => {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
}

function imageEncode(arrayBuffer) {
    let u8 = new Uint8Array(arrayBuffer)
    let b64encoded = btoa([].reduce.call(new Uint8Array(arrayBuffer), function (p, c) {
        return p + String.fromCharCode(c)
    }, ''))
    let mimetype = "image/jpeg"
    return "data:" + mimetype + ";base64," + b64encoded
}

export default {

    // 로그인
    login(id, password, callback) {

        const body = {
            username: id,
            password: password
        }
        axios
            .post(`/login`, body)
            .then((response) => {
                if (response.status === 200) {
                    const DATA = response.data;
                    store.auth = {
                        token: DATA.accessToken,
                        refreshToken: DATA.refreshToken,
                    };

                    const S = new DeviceStorage().localStorage();
                    S.save('token', DATA.accessToken);
                    S.save('refreshToken', DATA.refreshToken);

                    getUserInfo((res) => {
                        store.user = res.data;
                        sessionStorage.setItem('user', JSON.stringify(res.data));
                        if (res.status === 200) {
                            store.isAuthorized = true;
                            sessionStorage.setItem('isAuthorized', true);
                            callback(response);
                        } else {
                            return false;
                        }
                    });

                } else {
                    callback(response);
                }

            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 로그아웃
    logout(callback) {
        axios
            .get(`/logout`)
            .then((response) => {
                if (response.status === 200) {
                    // Object.keys(store.auth).map(key => {
                    //     store.user[key] = null;
                    // });
                    // Object.keys(store.user).map(key => {
                    //     store.user[key] = null;
                    // });
                    store.isAuthorized = false;
                    const S = new DeviceStorage().localStorage();
                    S.delete('token');
                    S.delete('refreshToken');
                    sessionStorage.removeItem('isAuthorized');
                    sessionStorage.removeItem('user');
                }

                Auth.signOut().then(data => {
                    callback(response);
                });

            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //사용자 전체 조회
    getUserList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchCategory1 ? "&customer.code=" + pageState.searchCategory1 : '';
        searchCondition += pageState.searchCategory2 ? "&site.code=" + pageState.searchCategory2 : '';
        searchCondition += pageState.searchText ? "&username=" + pageState.searchText : '';
        axios
            .get(`/users?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //사용자 상세 조회
    getUserOne(param, callback) {
        axios
            .get(`/users/${param}`)
            .then((response) => {
                if (response.data.picture) {
                    this.getUserImg(response.data.picture, (response2) => {
                        const imageDataUrl = response2.data;
                        const resData = {
                            data: {
                                ...response.data,
                                imageDataUrl: imageDataUrl,
                            },
                            status: 200,
                        }

                        callback(resData);
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    getMe(callback) {
        axios
            .get(`/me`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //사용자 중복체크
    checkUserOne(checkType, param, callback) {
        let searchCondition = "";
        switch (checkType) {
            case "username":
                searchCondition = `check?username=${param.username}`;
                break;
            case "phoneNumber":
                searchCondition = `phone-number/check?phoneNumber=${param.phoneNumber}`;
                break;
            case "nickname":
                searchCondition = `nickname/check?nickname=${param.nickname}`;
                break;
            default:
                break;
        }
        axios
            .get(`/users/${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                if (error.response.status === 409) {
                    callback(error.response);
                } else {
                    console.log('error : ' + JSON.stringify(error));
                }
            });
    },

    // 사용자 추가
    addUser(state, callback) {
        const body = {
            "username": state.username,
            "name": state.name,
            "email": state.email,
            "nickname": state.nickname,
            "contact": state.contact,
            "phoneNumber": state.phoneNumber,
            "password": state.password,
            "status": state.status,
            "customer": {
                "code": state.customer.code,
                "name": state.customer.name,
            },
            "site": {
                "code": state.site.code,
                "name": state.site.name,
            },
            "place": {
                "code": state.place.code,
                "name": state.place.name,
            },
            "menuGroup": state.menuGroup,
            "authList": state.authList,
            "roleList": state.roleList,
            "picture": '',
            "imageDataUrl": state.imageDataUrl,
            "enabled": state.enabled,
        }

        if (state.imageDataUrl !== '') {
            this.UserImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.id;
                    body.picture = imageId;
                    body.imageDataUrl = '';
                    axios
                        .post(`/users`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        });
                } else if (response === 'error') {
                    body.picture = '';
                    body.imageDataUrl = '';
                    axios
                        .post(`/users`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        });
                }
            });
        } else {
            axios
                .post(`/users`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                });
        }
    },

    // 사용자 추가
    updateUser(state, callback) {
        const body = {
            "username": state.username,
            "name": state.name,
            "email": state.email,
            "nickname": state.nickname,
            "contact": state.contact,
            "phoneNumber": state.phoneNumber,
            "status": state.status,
            "customer": {
                "code": state.customer.code,
                "name": state.customer.name,
            },
            "site": {
                "code": state.site.code,
                "name": state.site.name,
            },
            "place": {
                "code": state.place.code,
                "name": state.place.name,
            },
            "menuGroup": state.menuGroup,
            "authList": state.authList,
            "roleList": state.roleList,
            "picture": state.picture,
            "imageDataUrl": state.imageDataUrl,
            "enabled": state.enabled,
        }
        if (state.password) {
            body.password = state.password;
        }

        if (state.imageDataUrl !== '') {
            this.UserImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.id;
                    body.picture = imageId;
                    axios
                        .put(`/users/${state.username}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        });
                } else if (response === 'error') {
                    body.picture = '';
                    axios
                        .put(`/users/${state.username}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        });
                }
            });
        } else {
            axios
                .put(`/users/${state.username}`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                });
        }
    },

    // 사용자 - 이미지 가져오기
    getUserImg(image, callback) {
        axios
            .get(`/files/${image}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                response.data = imageEncode(response.data);
                callback(response);
            })
            .catch((error) => {
                console.log('error : ', error);
                callback({data: null});
            })
    },

    // 사용자 - 이미지업로드
    UserImgUpload(formData, callback) {
        let blob = dataURLtoBlob(formData.imageDataUrl);
        let form = new FormData()
        form.append('file', blob);
        form.append('target', 'dev-account-smartiok');
        form.append('path', 'picture');
        form.append('description', '프로필')
        axios
            .post(`/files/upload`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    getUserAutomationList(username, callback) {
        axios
            .get(`/automation/user/${username}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                if (error.response.status === 404) {
                    callback(error.response);
                } else {
                    console.log('error : ' + JSON.stringify(error));
                }
            });
    },

    getUserAutomationOne(automationId, callback) {
        axios
            .get(`/automation/${automationId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    addUserDevice(state, callback) {
        const userDevice = {
            "deviceId": state.deviceId,
            "deviceNickname": state.deviceNickname,
            "spaceId": state.spaceId,
            "placeId": state.placeId,
            "username": state.username
        };

        axios
            .post(`/devices/${userDevice.deviceId}/users`, userDevice)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },


    getUserDeviceList(params, callback) {
        const queryString = params.username ? `?username=${params.username}` : '';
        axios
            .get(`/devices/users` + queryString)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 사용자 - 유저 삭제
    removeUserList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/users/${code.username}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 장비타입 전체 조회
    getToolsTypeList(pageState, callback) {
        axios
            .get(`/devices/types?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 장비타입 상세 조회
    getToolsTypeOne(code, callback) {
        axios
            .get(`/devices/types/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                if (error.response.status === 404) {
                    callback(error.response);
                } else {
                    console.log('error : ' + JSON.stringify(error));
                }
            });
    },

    // 장비 - 장비타입 등록시 장비타입코드 중복 체크
    chkDuplicateToolsType(code, callback) {
        axios
            // .get(`/devices/types?code=${code}`)
            .get(`/devices/types/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            });
    },

    // 장비 - 장비타입 삭제
    removeToolsTypeList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/devices/types/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 장비타입 추가
    addToolsType(state, callback) {
        const body = {
            "code": state.code,
            "name": state.name,
            "usable": state.usable
        }
        axios
            .post(`/devices/types`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장비 - 장비타입 수정
    updateToolsType(state, callback) {
        const body = {
            "code": state.code,
            "name": state.name,
            "usable": state.usable
        }
        axios
            .put(`/devices/types/${state.code}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장비 - 모델 전체 조회
    getToolsModelList(pageState, callback) {
        let manufacturerCode = '';
        let typeCode = '';
        if (pageState.manufacturer.code !== '' && pageState.manufacturer.code !== undefined) {
            manufacturerCode = `/${pageState.manufacturer.code}`;
        }
        if (pageState.type.code !== '' && pageState.type.code !== undefined) {
            typeCode = `/${pageState.type.code}`;
        }

        axios
            .get(`/manufacturers${manufacturerCode}/models${typeCode}?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            });
    },

    // 장비 - 모델 상세 조회
    getToolsModelOne(params, callback) {
        axios
            .get(`/manufacturers/${params.manufacturerCode}/models/${params.code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            });
    },

    // 장비 - 모델 등록시 모델코드 중복 체크
    chkDuplicateToolsModel(params, callback) {
        axios
            // .get(`/manufacturers/models?code=${params.code}`)
            .get(`manufacturers/${params.manufacturer.code}/models/${params.code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            });
    },

    // 장비 - 모델 삭제
    removeToolsModelList(items, callback) {
        const list = items.map(codeList => {
            return axios.delete(`/manufacturers/${codeList.manufacturerCode}/models/${codeList.code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 모델 추가
    addToolsModel(state, callback) {
        const body = {
            "code": state.code,
            "name": state.name,
            "type": {
                "code": state.type.code
            },
            "attributes":
                state.attributes.map(data => {
                    return ({
                        "id": data.id
                    })
                })
            ,
            "operations":
                state.operations.map(data => {
                    return ({
                        "id": data.id
                    })
                })
            ,
            "usable": state.usable
        }
        axios
            .post(`/manufacturers/${state.manufacturer.code}/models`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 모델 수정
    updateToolsModel(state, callback) {
        const body = {
            "code": state.code,
            "name": state.name,
            "type": {
                "code": state.type.code
            },
            "attributes":
                state.attributes.map(data => {
                    return ({
                        "id": data.id
                    })
                })
            ,
            "operations":
                state.operations.map(data => {
                    return ({
                        "id": data.id
                    })
                })
            ,
            "usable": state.usable
        }
        axios
            .put(`/manufacturers/${state.manufacturer.code}/models/${state.code}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 디바이스 전체 조회
    getToolsDeviceList(pageState, callback) {
        axios
            .get(`/devices?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&${pageState.categoryCode}=${pageState.searchText}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 디바이스 상세 조회
    getToolsDeviceOne(deviceId, callback) {
        axios
            .get(`/devices/${deviceId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 디바이스 삭제
    removeToolsDeviceList(items, callback) {
        const list = items.map(deviceId => {
            return axios.delete(`/devices/${deviceId}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 디바이스 추가
    addToolsDevice(state, callback) {
        const body = {
            name: state.name,
            model: {
                modelId: state.model.modelId
            },
            serialNumber: state.serialNumber,
            usable: state.usable
        }
        axios
            .post(`/devices`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장비 - 디바이스 수정
    updateToolsDevice(state, callback) {
        const body = {
            name: state.name,
            model: {
                modelId: state.model.modelId
            },
            serialNumber: state.serialNumber,
            usable: state.usable
        }
        axios
            .put(`/devices/${state.deviceId}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장비 - 제조사 전체 조회
    getToolsManufacturerList(pageState, callback) {
        axios
            .get(`/manufacturers?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 제조사 상세 조회
    getToolsManufacturerOne(code, callback) {
        axios
            .get(`/manufacturers/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장비 - 제조사 등록시 제조사코드 중복 체크
    chkDuplicateToolsManufacturer(code, callback) {
        axios
            // .get(`/manufacturers?code=${code}`)
            .get(`/manufacturers/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            });
    },

    // 장비 - 제조사 삭제
    removeToolsManufacturerList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/manufacturers/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 제조사 추가
    addToolsManufacturer(state, callback) {
        console.log(state);
        const body = {
            "code": state.code,
            "name": state.name,
            "usable": state.usable
        }
        axios
            .post(`/manufacturers`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장비 - 제조사 수정
    updateToolsManufacturer(state, callback) {
        const body = {
            "code": state.code,
            "name": state.name,
            "usable": state.usable
        }
        axios
            .put(`/manufacturers/${state.code}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장비 - 속성 전체 조회
    getToolsPropertyList(pageState, callback) {
        axios
            .get(`/models/properties?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 속성 상세 조회
    getToolsPropertyOne(code, callback) {
        axios
            .get(`/models/properties/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 제조사 삭제
    removeToolsPropertyList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/models/properties/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장비 - 제조사 추가
    addToolsProperty(state, callback) {
        let body = {};
        if (state.valueType === 'RANGE') {
            body = {
                code: state.code,
                name: state.name,
                valueType: state.valueType,
                bottomValue: state.bottomValue,
                topValue: state.topValue,
                resolution: state.resolution,
                unit: state.unit,
            };
        } else if (state.valueType === 'ENUMERATION') {
            body = {
                code: state.code,
                name: state.name,
                valueType: state.valueType,
                availableValues: state.availableValues,
            }
        }
        axios
            .post(`/models/properties`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장비 - 제조사 수정
    updateToolsProperty(state, callback) {
        let body = {};
        if (state.valueType === 'RANGE') {
            body = {
                code: state.code,
                name: state.name,
                valueType: state.valueType,
                bottomValue: state.bottomValue,
                topValue: state.topValue,
                resolution: state.resolution,
                unit: state.unit
            };
        } else if (state.valueType === 'ENUMERATION') {
            body = {
                code: state.code,
                name: state.name,
                valueType: state.valueType,
                availableValues: state.availableValues,
            }
        }
        axios
            .put(`/models/properties/${state.id}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 고객사 전체 조회
    getCustomerList(pageState, callback) {
        axios
            .get(`/customers?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 고객사 상세 조회
    getCustomerOne(code, callback) {
        axios
            .get(`/customers/${code}`)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data.imageId && response.data.imageId !== "") {
                        this.getCustomerImg(response.data.imageId, (response2) => {
                            const imageDataUrl = imageEncode(response2.data);
                            const resData = {
                                data: {
                                    ...response.data,
                                    imageDataUrl: imageDataUrl,
                                },
                                status: 200,
                            }
                            callback(resData);
                        });
                    } else {
                        callback(response);
                    }

                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 고객사 중복 체크
    chkDuplicateCustomer(code, callback) {
        axios
            .get(`/customers/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            });
    },

    // 장소 - 고객사 삭제
    removeCustomerList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/customers/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 고객사 추가
    addCustomer(state, callback) {
        if (state.imageDataUrl !== '') {
            this.customerImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.id;
                    const body = {
                        ...state,
                        imageId: imageId,
                    }
                    body.imageDataUrl = '';
                    axios
                        .post(`/customers`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        ...state,
                        imageId: '',
                    }
                    body.imageDataUrl = '';
                    axios
                        .put(`/customers/${state.code}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                ...state,
            }

            axios
                .post(`/customers`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }

    },

    // 장소 - 고객사 수정
    updateCustomer(state, callback) {
        if (state.imageDataUrl !== '') {
            this.customerImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.id;
                    const body = {
                        ...state,
                        imageId: imageId,
                    }
                    body.imageDataUrl = '';
                    axios
                        .put(`/customers/${state.code}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        ...state,
                        imageId: '',
                    }
                    body.imageDataUrl = '';
                    axios
                        .put(`/customers/${state.code}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                ...state,
            }

            axios
                .put(`/customers/${state.code}`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 장소 - 고객사 이미지업로드
    customerImgUpload(formData, callback) {
        let blob = dataURLtoBlob(formData.imageDataUrl);
        let form = new FormData()
        form.append('file', blob);
        form.append('target', "dev-placement-smartiok");
        form.append('path', "customer");

        axios
            // .post(`/placement/customer/images`, form)
            .post(`/files/upload`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    // 장소 - 고객사 이미지조회
    getCustomerImg(imageId, callback) {
        axios
            // .get(`/placement/customer/images/view/${imageId}`, {
            .get(`/files/${imageId}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ', error);
                callback({data: null});
            })
    },

    // 장소 - 현장 장소 전체 조회
    getSitePlaceList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.siteCode ? "&site.code=" + pageState.siteCode : '';
        axios
            .get(`/sites/places?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                // siteCode param으로 조회시 데이터가 없으면 undefined반환
                console.log('error : ' + JSON.stringify(error));
                callback(error);
            })
    },

    // 장소 - 현장 장소 상세 조회
    getSitePlaceOne(code, callback) {
        axios
            .get(`/sites/places/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 현장 장소 중복 체크
    chkDuplicateSitePlace(state, callback) {
        axios
            .get(`/sites/places/${state.site.code}/${state.dong}/${state.ho}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            });
    },

    // 장소 - 현장 장소 삭제
    removeSitePlaceList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/sites/places/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 장소 추가
    addSitePlace(state, callback) {
        console.log("addSitePlace", state);
        const body = {
            ...state
        }

        axios
            .post(`/sites/places`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 현장 장소 수정
    updateSitePlace(state, callback) {
        const body = {
            ...state
        }

        axios
            .put(`/sites/places/${state.code}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 현장 전체 조회
    getSitesList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.customerCode ? "&customerCode=" + pageState.customerCode : '';
        axios
            .get(`/sites?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 상세 조회(codeArray)
    getSitesOne(codeArray, callback) {
        const list = codeArray.map(code => {
            return axios.get(`/sites/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 상세 조회(code)
    getSiteOne(code, callback) {
        axios
            .get(`/sites/${code}`)
            .then((response) => {
                if (response.data.siteImageId && response.data.siteImageId !== "") {
                    this.getSiteImg(response.data.siteImageId, (response2) => {
                        const imageDataUrl = imageEncode(response2.data);
                        const resData = {
                            data: {
                                ...response.data,
                                imageDataUrl: imageDataUrl,
                            },
                            status: 200,
                        }
                        callback(resData);
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 중복 체크
    chkDuplicateSite(code, callback) {
        axios
            .get(`/sites/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            });
    },

    // 장소 - 현장 삭제
    removeSitesList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/sites/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 추가
    addSite(state, callback) {
        if (state.imageDataUrl !== '') {
            this.siteImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.id;
                    const body = {
                        ...state,
                        customer: state.customer,
                        region: state.region,
                        siteImageId: imageId,
                    }

                    body.imageDataUrl = '';

                    axios
                        .post(`/sites`, body)
                        .then((response) => {
                            if (state.manufacturerCode !== "") {
                                this.addHomenet(state);
                            }
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        ...state,
                        customer: state.customer,
                        region: state.region,
                        siteImageId: '',
                    }

                    body.imageDataUrl = '';

                    axios
                        .post(`/sites`, body)
                        .then((response) => {
                            if (state.manufacturerCode !== "") {
                                this.addHomenet(state);
                            }
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                ...state,
                customer: state.customer,
                region: state.region,
            }

            axios
                .post(`/sites`, body)
                .then((response) => {
                    if (state.manufacturerCode !== "") {
                        this.addHomenet(state);
                    }
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 장소 - 현장 수정
    updateSite(state, callback) {
        console.log("updateSite", state);
        if (state.imageDataUrl !== '') {
            this.siteImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.id;
                    const body = {
                        ...state,
                        customer: state.customer,
                        region: state.region,
                        siteImageId: imageId,
                    }
                    body.imageDataUrl = '';
                    axios
                        .put(`/sites/${state.code}`, body)
                        .then((response) => {
                            if (state.manufacturerCode !== "") {
                                this.updateHomenet(state);
                            }
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        ...state,
                        customer: state.customer,
                        region: state.region,
                        siteImageId: '',
                    }
                    body.imageDataUrl = '';
                    axios
                        .put(`/sites/${state.code}`, body)
                        .then((response) => {
                            if (state.manufacturerCode !== "") {
                                this.updateHomenet(state);
                            }
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                ...state,
                customer: state.customer,
                region: state.region,
            }

            axios
                .put(`/sites/${state.code}`, body)
                .then((response) => {
                    if (state.manufacturerCode !== "") {
                        this.updateHomenet(state);
                    }
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 장소 - 현장 이미지업로드
    siteImgUpload(formData, callback) {
        let blob = dataURLtoBlob(formData.imageDataUrl);
        let form = new FormData()
        form.append('file', blob);
        form.append('target', "dev-placement-smartiok");
        form.append('path', "site");

        axios
            .post(`/files/upload`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    // 장소 - 현장 이미지조회
    getSiteImg(imageId, callback) {
        axios
            .get(`/files/${imageId}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 현장 홈넷연동정보 조회
    getHomenetOne(siteCode, callback) {
        axios
            .get(`/homenets/connection/${siteCode}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                callback(error.response);
            })
    },

    // 장소 - 현장 홈넷연동정보 삭제
    removeHomenetList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/homenets/connection/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 홈넷연동정보 추가
    addHomenet(state, callback) {
        const body = {
            siteCode: state.code,
            customerCode: state.customer.code,
            authorizationUrl: state.authorizationUrl,
            controlUrl: state.controlUrl,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            deviceModelCodes: state.deviceModelCodes,
        }

        axios
            .post(`/homenets/connection`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 현장 홈넷연동정보 수정
    updateHomenet(state, callback) {
        const body = {
            siteCode: state.code,
            customerCode: state.customer.code,
            authorizationUrl: state.authorizationUrl,
            controlUrl: state.controlUrl,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            deviceModelCodes: state.deviceModelCodes,
        }

        axios
            .put(`/homenets/connection/${state.code}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 현장 - 시설물 전체 조회
    getFacilityList(pageState, callback) {
        axios
            .get(`/sites/facility?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}&site.code=${pageState.siteCode}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 - 시설물 상세 조회
    getFacilityOne(code, callback) {
        axios
            .get(`/sites/facility/${code}`)
            .then((response) => {
                if (response.data.imageId && response.data.imageId !== "") {
                    this.getFacilityImg(response.data.imageId, (response2) => {
                        const imageDataUrl = imageEncode(response2.data);
                        const resData = {
                            data: {
                                ...response.data,
                                imageDataUrl: imageDataUrl,
                            },
                            status: 200,
                        }
                        callback(resData);
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 - 시설물 삭제
    removeFacilityList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/sites/facility/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 - 시설물 추가
    addFacility(state, callback) {
        if (state.imageDataUrl !== '') {
            this.facilityImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.id;
                    const body = {
                        ...state,
                        imageId: imageId,
                    }
                    body.imageDataUrl = '';
                    axios
                        .post(`/sites/facility`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        ...state,
                        imageId: '',
                    }

                    axios
                        .post(`/sites/facility`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                ...state,
            }

            axios
                .post(`/sites/facility`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 장소 - 현장 - 시설물 수정
    updateFacility(state, callback) {
        if (state.imageDataUrl !== '') {
            this.facilityImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.id;
                    const body = {
                        ...state,
                        imageId: imageId,
                    }
                    body.imageDataUrl = '';
                    axios
                        .put(`/sites/facility/${state.code}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        ...state,
                        imageId: '',
                    }

                    axios
                        .put(`/sites/facility/${state.code}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                ...state,
            }

            axios
                .put(`/sites/facility/${state.code}`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 장소 - 현장 - 시설물 이미지업로드
    facilityImgUpload(formData, callback) {
        let blob = dataURLtoBlob(formData.imageDataUrl);
        let form = new FormData()
        form.append('file', blob);
        form.append('target', "dev-placement-smartiok");
        form.append('path', "facility");

        axios
            .post(`/files/upload`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    // 장소 - 현장 - 시설물 이미지조회
    getFacilityImg(imageId, callback) {
        axios
            .get(`/files/${imageId}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 현장 - 평면도 전체 조회
    getFloorPlanList(pageState, callback) {
        axios
            .get(`/sites/floor-plan?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&site.code=${pageState.siteCode}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 - 평면도 상세 조회
    getFloorPlanOne(code, callback) {
        axios
            .get(`/sites/floor-plan/${code}`)
            .then((response) => {
                if ((response.data.basicImageId && response.data.basicImageId !== "") || (response.data.expandedImageId && response.data.expandedImageId !== "")) {
                    const resData = {
                        data: {
                            ...response.data,
                        },
                        status: 200,
                    }

                    axios.all([this.getFloorPlanImg(response.data.basicImageId), this.getFloorPlanImg(response.data.expandedImageId)])
                        .then(axios.spread(function (t1, t2) {
                            const basicImageDataUrl = t1.data && imageEncode(t1.data);
                            const expandedImageDataUrl = t2.data && imageEncode(t2.data);
                            resData.data = {
                                ...resData.data,
                                basicImageDataUrl: basicImageDataUrl,
                                expandedImageDataUrl: expandedImageDataUrl
                            }

                            console.log(resData);
                            callback(resData);
                        }))
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 장소 - 현장 - 평면도 삭제
    removeFloorPlanList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/sites/floor-plan/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });

    },

    // 장소 - 현장 - 평면도 추가
    addFloorPlan(state, callback) {

        console.log("addFloorPlan", state);

        if (state.basicImageDataUrl !== '' || state.expandedImageDataUrl !== '') {
            const body = {
                ...state,
            };
            let rtnBasic = false;
            let rtnExpanded = false;
            if (state.basicImageDataUrl !== '') {
                this.floorPlanImgUpload(state.basicImageDataUrl, (response) => {
                    if (response.status === 200) {
                        const imageId = response.data.id;
                        body.basicImageId = imageId;
                        body.basicImageDataUrl = '';
                        rtnBasic = true;
                        sendAxios();
                    } else if (response === 'error') {
                        body.basicImageId = undefined;
                        body.basicImageDataUrl = '';
                        rtnBasic = true;
                        sendAxios();
                    }
                });
            } else {
                body.basicImageId = undefined;
                body.basicImageDataUrl = '';
                rtnBasic = true;
                sendAxios()
            }

            if (state.expandedImageDataUrl !== '') {
                this.floorPlanImgUpload(state.expandedImageDataUrl, (response) => {
                    if (response.status === 200) {
                        const imageId = response.data.id;
                        body.expandedImageId = imageId;
                        body.expandedImageDataUrl = '';
                        rtnExpanded = true;
                        sendAxios()
                    } else if (response === 'error') {
                        body.expandedImageId = undefined;
                        body.expandedImageDataUrl = '';
                        rtnExpanded = true;
                        sendAxios()
                    }
                });
            } else {
                body.expandedImageId = undefined;
                body.expandedImageDataUrl = '';
                rtnExpanded = true;
                sendAxios()
            }

            function sendAxios() {
                if (rtnBasic && rtnExpanded) {

                    axios
                        .post(`/sites/floor-plan`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            }

        } else {
            const body = {
                ...state,
            }

            body.basicImageId = undefined;
            body.expandedImageId = undefined;

            axios
                .post(`/sites/floor-plan`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 장소 - 현장 - 평면도 수정
    updateFloorPlan(state, callback) {
        console.log("addFloorPlan", state);

        if (state.basicImageDataUrl !== '' || state.expandedImageDataUrl !== '') {

            const body = {
                ...state,
            };
            let rtnBasic = false;
            let rtnExpanded = false;
            if (state.basicImageDataUrl !== '') {
                this.floorPlanImgUpload(state.basicImageDataUrl, (response) => {
                    if (response.status === 200) {
                        const imageId = response.data.id;
                        body.basicImageId = imageId;
                        body.basicImageDataUrl = '';
                        rtnBasic = true;
                        sendAxios();
                    } else if (response === 'error') {
                        body.basicImageId = undefined;
                        body.basicImageDataUrl = '';
                        rtnBasic = true;
                        sendAxios();
                    }
                });
            } else {
                rtnBasic = true;
                sendAxios()
            }

            if (state.expandedImageDataUrl !== '') {
                this.floorPlanImgUpload(state.expandedImageDataUrl, (response) => {
                    if (response.status === 200) {
                        const imageId = response.data.id;
                        body.expandedImageId = imageId;
                        body.expandedImageDataUrl = '';
                        rtnExpanded = true;
                        sendAxios()
                    } else if (response === 'error') {
                        body.expandedImageId = undefined;
                        body.expandedImageDataUrl = '';
                        rtnExpanded = true;
                        sendAxios()
                    }
                });
            } else {
                rtnExpanded = true;
                sendAxios()
            }

            function sendAxios() {
                if (rtnBasic && rtnExpanded) {

                    axios
                        .put(`/sites/floor-plan/${state.code}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            }

        } else {
            const body = {
                ...state,
            }

            body.basicImageId = undefined;
            body.expandedImageId = undefined;

            axios
                .put(`/sites/floor-plan/${state.code}`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 장소 - 현장 - 평면도 이미지업로드
    async floorPlanImgUpload(imageDataUrl, callback) {
        let blob = dataURLtoBlob(imageDataUrl);
        let form = new FormData()
        form.append('file', blob);
        form.append('target', "dev-placement-smartiok");
        form.append('path', "facility");

        await axios
            .post(`/files/upload`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    // 장소 - 현장 - 평면도 이미지조회
    getFloorPlanImg(imageId) {
        console.log(imageId);
        if (!imageId) return {data: undefined};
        return axios
            .get(`/files/${imageId}`, {
                responseType: 'arraybuffer'
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 지역코드 전체 조회
    getRegionList(callback) {
        axios
            .get(`/regions`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 설정 - 프로그램 전체 조회
    getProgramList(pageState, callback) {
        axios
            .get(`/system/program?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 설정 - 프로그램 삭제
    removeProgramList(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/system/program/${code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 프로그램 추가
    addProgram(items, callback) {

        if (items.length > 0) {
            const list = items.map(data => {
                return axios.post(`/system/program`, data)
            });

            axios
                .all(list)
                .then((response) => {
                    callback(true);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                });
        }
    },

    // 설정 - 프로그램 수정
    updateProgram(items, callback) {

        if (items.length > 0) {

            const list = items.map(data => {
                return axios.put(`/system/program/${data.code}`, data)
            });

            axios
                .all(list)
                .then((response) => {
                    callback(true);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                });
        }
    },

    // 설정 - 메뉴 목록 조회(트리형)
    getMenuTreeList(pageState, callback) {
        axios
            .get(`/system/menu/getTree/${pageState.codeType}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 메뉴 상세 조회
    getMenuOne(menuId, callback) {
        axios
            .get(`/system/menu/${menuId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 메뉴 삭제
    removeMenu(menuId, callback) {
        axios
            .delete(`/system/menu/${menuId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 메뉴 등록
    addMenu(menuParam, callback) {
        axios
            .post(`system/menu`, menuParam)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 메뉴 수정
    updateMenu(menuParam, callback) {
        axios
            .put(`system/menu/${menuParam.menuId}`, menuParam)
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 권한그룹설정 목록(메뉴별)
    getAuthGroupMenuList(menuId, callback) {
        axios
            .get(`/system/authGroupMenu/menu/${menuId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 설정 - 권한그룹설정 삭제
    removeAuthGroupMenu(authGroupMenuId, callback) {
        axios
            .delete(`/system/authGroupMenu/${authGroupMenuId}`)
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 설정 - 권한그룹설정 등록
    addAuthGroupMenu(addForm, callback) {
        axios
            .post(`/system/authGroupMenu`, addForm)
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 설정 - 권한그룹설정 수정
    updateAuthGroupMenu(authGroupMenuId, updateForm) {
        axios
            .put(`/system/authGroupMenu/${authGroupMenuId}`, updateForm)
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 설정 - 코드유형 목록 조회
    getCodeTypeList(pageState, callback) {
        axios
            .get(`/system/codeType?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&name=${pageState.searchText}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 설정 - 코드유형 상세 조회
    getCodeTypeOne(codeType, callback) {
        axios
            .get(`/system/codeType/${codeType}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 설정 - 코드유형 삭제
    removeCodeTypeList(items, callback) {
        const list = items.map(codeType => {
            return axios.delete(`/system/codeType/${codeType}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 코드유형 등록
    addCodeType(state, callback) {
        axios
            .post(`/system/codeType`, state)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 코드유형 수정
    updateCodeType(state, callback) {
        const body = {};
        axios
            .put(`/system/codeType/${state.code}`, state)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 코드 목록 조회(타입별)
    getCodeList(codeType, callback) {
        axios
            .get(`/system/code?codeType=${codeType}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 코드 상세 조회
    getCodeOne(codeId, callback) {
        axios
            .get(`/system/code/${codeId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 코드 삭제
    removeCode(codeId, callback) {
        axios
            .delete(`/system/code/${codeId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 코드 등록
    addCode(state, callback) {
        axios
            .post(`/system/code`, state)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                if (error.response.status === 409) {
                    callback(error.response);
                }
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 코드 수정
    updateCode(state, callback) {
        axios
            .put(`/system/code/${state.id}`, state)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 약관 목록
    getPolicyList(pageState, callback) {
        axios
            .get(`/system/policy?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&customer.code=${pageState.customer.code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 약관 상세
    getPolicyOne(policyId, callback) {
        axios
            .get(`/system/policy/${policyId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 약관 삭제
    removePolicyList(items, callback) {
        const list = items.map(policyId => {
            return axios.delete(`/system/policy/${policyId}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 약관 등록
    addPolicy(state, callback) {
        axios
            .post(`/system/policy`, state)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 설정 - 약관 수정
    updatePolicy(state, callback) {
        axios
            .put(`/system/policy/${state.policyId}`, state)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    // 이력 - 디바이스 이력 전체 조회(고객사 필수 선택)
    getDeviceHistoryList(pageState, callback) {
        axios
            .get(`/customers/${pageState.customerCode}/statuses/logs?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}&startTime=${pageState.searchStartDate}&endTime=${pageState.searchEndDate}&deviceId=${pageState.searchText2}&username=${pageState.searchText}&siteCode=${pageState.siteCode}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 공지사항 목록
    getNoticeList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchCategory1 ? "&customer.code=" + pageState.searchCategory1 : '';
        searchCondition += pageState.searchCategory2 ? "&site.code=" + pageState.searchCategory2 : '';
        searchCondition += pageState.searchCategory3 ? "&classification=" + pageState.searchCategory3 : '';
        axios
            //.get(`/community/notice?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .get(`/community/notice`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 공지사항 상세
    getNoticeOne(noticeId, callback) {
        axios
            .get(`/community/notice/${noticeId}`)
            .then((response) => {
                if (response.data.image) {
                    this.getNoticeImg(response.data.image, (response2) => {
                        if (response2.status === 200) {
                            const imageDataUrl = imageEncode(response2.data);
                            const resData = {
                                data: {
                                    ...response.data,
                                    imageDataUrl: imageDataUrl,
                                },
                                status: 200,
                            }
                            callback(resData);
                        }
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 공지사항 등록
    addNotice(state, callback) {
        if (state.imageDataUrl !== '') {
            this.noticeImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.imageId;
                    const body = {
                        "classification": state.classification,
                        "mainNotice": state.mainNotice,
                        "title": state.title,
                        "contents": state.contents,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "dong": state.dong ? state.dong : "ALL",
                        "ho": state.ho ? state.ho : "ALL",
                        "startDate": state.startDate,
                        "endDate": state.endDate,
                        "image": [imageId],
                        "publicYn": state.publicYn
                    }
                    axios
                        .post(`/community/notice`, body)
                        .then((response) => {
                            callback(response);
                            console.log(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        "classification": state.classification,
                        "mainNotice": state.mainNotice,
                        "title": state.title,
                        "contents": state.contents,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "dong": state.dong ? state.dong : "ALL",
                        "ho": state.ho ? state.ho : "ALL",
                        "startDate": state.startDate,
                        "endDate": state.endDate,
                        "image": [''],
                        "publicYn": state.publicYn
                    }
                    axios
                        .post(`/community/notice`, body)
                        .then((response) => {
                            callback(response);
                            console.log(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                "classification": state.classification,
                "mainNotice": state.mainNotice,
                "title": state.title,
                "contents": state.contents,
                "customer": {
                    "code": state.customer.code,
                    "name": state.customer.name,
                },
                "site": {
                    "code": state.site.code,
                    "name": state.site.name,
                },
                "dong": state.dong ? state.dong : "ALL",
                "ho": state.ho ? state.ho : "ALL",
                "startDate": state.startDate,
                "endDate": state.endDate,
                "image": [],
                "publicYn": state.publicYn
            }
            axios
                .post(`/community/notice`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    //커뮤니티 - 공지사항 수정
    updateNotice(state, callback) {
        if (state.imageDataUrl !== '') {
            this.noticeImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.imageId;
                    const body = {
                        "classification": state.classification,
                        "mainNotice": state.mainNotice,
                        "title": state.title,
                        "contents": state.contents,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "dong": state.dong ? state.dong : "ALL",
                        "ho": state.ho ? state.ho : "ALL",
                        "startDate": state.startDate,
                        "endDate": state.endDate,
                        "image": [imageId],
                        "publicYn": state.publicYn
                    }
                    axios
                        .put(`/community/notice/${state.noticeId}`, body)
                        .then((response) => {
                            callback(response);
                            console.log(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        "classification": state.classification,
                        "mainNotice": state.mainNotice,
                        "title": state.title,
                        "contents": state.contents,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "dong": state.dong ? state.dong : "ALL",
                        "ho": state.ho ? state.ho : "ALL",
                        "startDate": state.startDate,
                        "endDate": state.endDate,
                        "image": [''],
                        "publicYn": state.publicYn
                    }
                    axios
                        .put(`/community/notice/${state.noticeId}`, body)
                        .then((response) => {
                            callback(response);
                            console.log(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                "classification": state.classification,
                "mainNotice": state.mainNotice,
                "title": state.title,
                "contents": state.contents,
                "customer": {
                    "code": state.customer.code,
                    "name": state.customer.name,
                },
                "site": {
                    "code": state.site.code,
                    "name": state.site.name,
                },
                "dong": state.dong ? state.dong : "ALL",
                "ho": state.ho ? state.ho : "ALL",
                "startDate": state.startDate,
                "endDate": state.endDate,
                "image": state.image ? state.image : [],
                "publicYn": state.publicYn
            }
            axios
                .put(`/community/notice/${state.noticeId}`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 커뮤니티 - 이미지조회
    getNoticeImg(image, callback) {
        axios
            .get(`/community/notice/image/view/${image}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - 이미지업로드
    noticeImgUpload(formData, callback) {
        let blob = dataURLtoBlob(formData.imageDataUrl);
        let form = new FormData()
        form.append('image', blob);

        axios
            .post(`/community/notice/image`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    //커뮤니티 - 공지사항 삭제
    removeNotice(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/community/notice/${code.noticeId}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //커뮤니티 - Feed 목록
    getFeedList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchCategory1 ? "&customer.code=" + pageState.searchCategory1 : '';
        searchCondition += pageState.searchCategory2 ? "&site.code=" + pageState.searchCategory2 : '';
        searchCondition += pageState.searchStartDate ? "&searchStartDate=" + pageState.searchStartDate : '';
        searchCondition += pageState.searchEndDate ? "&searchEndDate=" + pageState.searchEndDate : '';

        axios
            .get(`/community/feed?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - Feed 상세
    getFeedOne(feedId, callback) {
        axios
            .get(`/community/feed/${feedId}`)
            .then((response) => {
                if (response.data.image) {
                    this.getFeedImg(response.data.image, (response2) => {
                        if (response2.status === 200) {
                            const imageDataUrl = imageEncode(response2.data);
                            const resData = {
                                data: {
                                    ...response.data,
                                    imageDataUrl: imageDataUrl,
                                },
                                status: 200,
                            }
                            callback(resData);
                        }
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - feed이미지조회
    getFeedImg(image, callback) {
        axios
            .get(`/community/feed/image/view/${image}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - Feed 댓글 리스트
    getFeedCommentList(pageState, callback) {
        axios
            .get(`/community/feed/${pageState.feedId}/comments?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - FAQ 리스트
    getFaqList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchCategory1 ? "&customer.code=" + pageState.searchCategory1 : '';
        searchCondition += pageState.searchCategory2 ? "&site.code=" + pageState.searchCategory2 : '';
        searchCondition += pageState.searchText ? "&title=" + pageState.searchText : '';
        axios
            .get(`/community/faq?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - FAQ 상세
    getFaqOne(faqId, callback) {
        axios
            .get(`/community/faq/${faqId}`)
            .then((response) => {
                if (response.data.image) {
                    this.getFaqImg(response.data.image, (response2) => {
                        if (response2.status === 200) {
                            const imageDataUrl = imageEncode(response2.data);
                            const resData = {
                                data: {
                                    ...response.data,
                                    imageDataUrl: imageDataUrl,
                                },
                                status: 200,
                            }
                            callback(resData);
                        }
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - FAQ 이미지 가져오기
    getFaqImg(image, callback) {
        axios
            .get(`/community/faq/image/view/${image}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - FAQ 이미지업로드
    faqImgUpload(formData, callback) {
        let blob = dataURLtoBlob(formData.imageDataUrl);
        let form = new FormData()
        form.append('image', blob);

        axios
            .post(`/community/faq/image`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    //커뮤니티 - FAQ 등록
    addFaq(state, callback) {
        if (state.imageDataUrl !== '') {
            this.faqImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.imageId;
                    const body = {
                        "classification": state.classification,
                        "title": state.title,
                        "contents": state.contents,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "image": [imageId],
                        "publicYn": state.publicYn
                    }
                    axios
                        .post(`/community/faq`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        "classification": state.classification,
                        "title": state.title,
                        "contents": state.contents,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "image": [''],
                        "publicYn": state.publicYn
                    }
                    axios
                        .post(`/community/faq`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                "classification": state.classification,
                "title": state.title,
                "contents": state.contents,
                "customer": {
                    "code": state.customer.code,
                    "name": state.customer.name,
                },
                "site": {
                    "code": state.site.code,
                    "name": state.site.name,
                },
                "image": [],
                "publicYn": state.publicYn
            }
            axios
                .post(`/community/faq`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    //커뮤니티 - FAQ 수정
    updateFaq(state, callback) {
        if (state.imageDataUrl !== '') {
            this.faqImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.imageId;
                    const body = {
                        "classification": state.classification,
                        "title": state.title,
                        "contents": state.contents,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "image": [imageId],
                        "publicYn": state.publicYn
                    }
                    axios
                        .put(`/community/faq/${state.faqId}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        "classification": state.classification,
                        "title": state.title,
                        "contents": state.contents,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "image": [''],
                        "publicYn": state.publicYn
                    }
                    axios
                        .put(`/community/faq/${state.faqId}`, body)
                        .then((response) => {
                            callback(response);
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                "classification": state.classification,
                "title": state.title,
                "contents": state.contents,
                "customer": {
                    "code": state.customer.code,
                    "name": state.customer.name,
                },
                "site": {
                    "code": state.site.code,
                    "name": state.site.name,
                },
                "image": state.image ? state.image : [],
                "publicYn": state.publicYn
            }
            axios
                .put(`/community/faq/${state.faqId}`, body)
                .then((response) => {
                    callback(response);
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    //커뮤니티 - FAQ 삭제
    removeFaq(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/community/faq/${code.faqId}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //커뮤니티 - QaA 리스트
    getQnaList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchCategory1 ? "&customer.code=" + pageState.searchCategory1 : '';
        searchCondition += pageState.searchCategory2 ? "&site.code=" + pageState.searchCategory2 : '';
        searchCondition += pageState.searchText ? "&title=" + pageState.searchText : '';

        axios
            .get(`/community/qna?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - QaA 상세
    getQnaOne(questionId, callback) {
        axios
            .get(`/community/qna/${questionId}`)
            .then((response) => {
                if (response.data.image) {
                    this.getQnaImg(response.data.image, (response2) => {
                        const imgeDataUrlList = [];
                        response2.map(img => {
                            if (img.status === 200) {
                                const imageDataUrl = imageEncode(img.data);
                                imgeDataUrlList.push(imageDataUrl);
                            }

                        })
                        const resData = {
                            data: {
                                ...response.data,
                                imageDataUrl: imgeDataUrlList,
                            },
                            status: 200,
                        }
                        callback(resData);

                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - QaA 이미지 가져오기
    getQnaImg(image, callback) {
        const list = image.map(img => {
            return axios.get(`/community/qna/image/view/${img}`, {
                responseType: 'arraybuffer'
            })
        });
        axios
            .all(list)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - QaA 답변 리스트
    getQnaAnswerList(questionId, callback) {
        axios
            .get(`/community/qna/${questionId}/answer`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })

    },

    //커뮤니티 - QaA 답변 상세
    getQnaAnswerOne(state, callback) {
        axios
            .get(`/community/qna/${state.questionId}/answer/${state.answerId}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })

    },

    //커뮤니티 - QaA 답변 등록
    addQnaAnswer(state, callback) {
        const body = {
            contents: state.contents,
            finished: state.finished,
            user: {
                username: state.userInfo.username,
                userFullName: state.userInfo.userFullName,
                picture: state.userInfo.picture,
                name: state.userInfo.name,
                contact: state.userInfo.contact,
                email: state.userInfo.email
            }
        }
        axios
            .post(`/community/qna/${state.questionId}/answer`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })

    },

    //커뮤니티 - QaA 답변 수정
    updateQnaAnswer(state, callback) {
        const body = {
            contents: state.contents,
            finished: state.finished,
            user: {
                username: state.userInfo.username,
                userFullName: state.userInfo.userFullName,
                picture: state.userInfo.picture,
                name: state.userInfo.name,
                contact: state.userInfo.contact,
                email: state.userInfo.email
            }
        }
        axios
            .put(`/community/qna/${state.questionId}/answer/${state.answerId}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })

    },

    //커뮤니티 - QaA 답변 삭제
    removeQnaAnswer(items, callback) {
        const list = items.map(item => {
            return axios.delete(`/community/qna/${item.questionId}/answer/${item.answerId}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //커뮤니티 - 유형코드 리스트 검색 
    getCommunityCodeTypeList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchText ? "&name=" + pageState.searchText : '';
        axios
            .get(`/community/codeType?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 유형코드 상세 검색 
    getCommunityCodeTypeOne(code, callback) {
        axios
            .get(`/community/codeType/${code}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - 유형코드 저장
    addCommunityCodeType(state, callback) {
        const body = {
            code: state.code,
            name: state.name,
            usable: state.usable,
        }

        axios
            .post(`/community/codeType`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - 유형코드 수정
    updateCommunityCodeType(state, callback) {
        const body = {
            name: state.name,
            usable: state.usable,
        }

        axios
            .put(`/community/codeType/${state.code}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 유형코드 삭제
    removeCommunityCodeType(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/community/codeType/${code.code}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //커뮤니티 - 코드 검색 
    async getCommunityCode(codeType, callback) {
        await axios
            .get(`/community/code?codeType=${codeType}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 코드 검색 
    getCommunityCodeOne(id, callback) {
        axios
            .get(`/community/code/${id}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - 코드 저장
    addCommunityCode(state, callback) {
        const body = {
            codeType: state.codeType,
            code: state.code,
            name: state.name,
            attribute1: state.attribute1,
            attribute2: state.attribute2,
            attribute3: state.attribute3,
            attribute4: state.attribute4,
            attribute5: state.attribute5,
            sort: state.sort,
            usable: state.usable,
        }

        axios
            .post(`/community/code`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.response.status === 409) {
                    callback(error.response);
                }
            })
    },

    // 커뮤니티 - 코드 수정
    updateCommunityCode(state, callback) {
        const body = {
            codeType: state.codeType,
            code: state.code,
            name: state.name,
            attribute1: state.attribute1,
            attribute2: state.attribute2,
            attribute3: state.attribute3,
            attribute4: state.attribute4,
            attribute5: state.attribute5,
            sort: state.sort,
            usable: state.usable,
        }

        axios
            .put(`/community/code/${state.id}`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 코드 삭제
    removeCommunityCode(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/community/code/${code.id}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //커뮤니티 - 예약 리스트 검색
    getReservationList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchCategory1 ? "&customer.code=" + pageState.searchCategory1 : '';
        searchCondition += pageState.searchCategory2 ? "&site.code=" + pageState.searchCategory2 : '';
        searchCondition += pageState.searchCategory3 ? "&groupCode=" + pageState.searchCategory3 : '';
        axios
            .get(`/community/reservation/item?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 예약 상세 검색 
    getReservationOne(itemId, callback) {
        axios
            .get(`/community/reservation/item/${itemId}`)
            .then((response) => {
                if (response.data.image) {
                    this.getReservationImg(response.data.image, (response2) => {
                        if (response2.status === 200) {
                            const imageDataUrl = imageEncode(response2.data);
                            const resData = {
                                data: {
                                    ...response.data,
                                    imageDataUrl: imageDataUrl,
                                },
                                status: 200,
                            }
                            callback(resData);
                        }
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 예약 휴일 검색 
    getHolidayList(itemId, callback) {
        axios
            .get(`/community/reservation/item/${itemId}/holiday`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 예약 현황 목록
    getReservationConditionList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchCategory1 ? "&status=" + pageState.searchCategory1 : '';
        searchCondition += pageState.searchText ? "&user.userFullName=" + pageState.searchText : '';
        axios
            .get(`/community/reservation/item/${pageState.itemId}/reservation?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - 예약 이미지 가져오기
    getReservationImg(image, callback) {
        axios
            .get(`/community/reservation/image/view/${image}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - 예약 이미지업로드
    reservationImgUpload(formData, callback) {
        let blob = dataURLtoBlob(formData.imageDataUrl);
        let form = new FormData()
        form.append('image', blob);

        axios
            .post(`/community/reservation/image`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    //커뮤니티 - 예약 등록
    addReservation(state, callback) {
        if (state.imageDataUrl !== '') {
            this.reservationImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.imageId;
                    const body = {
                        "name": state.name,
                        "description": state.description,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "groupCode": {
                            "code": state.groupCode.code,
                        },
                        "period": state.period,
                        "startDate": state.startDate,
                        "endDate": state.endDate,
                        "startHour": state.startHour,
                        "endHour": state.endHour,
                        "timePeriod": state.timePeriod,
                        "image": [imageId],
                        "usable": state.usable
                    }
                    axios
                        .post(`/community/reservation/item`, body)
                        .then((response) => {
                            if (response.status === 200 || response.status === 201) {
                                let holidayBody = {};
                                const list = state.newHoliday.map(hDay => {
                                    holidayBody = {
                                        "holiday": hDay.holiday,
                                    }
                                    return axios.post(`/community/reservation/item/${response.data.itemId}/holiday`, holidayBody)
                                });
                                axios
                                    .all(list)
                                    .then((response2) => {
                                        callback(response);
                                    })
                                    .catch((error) => {
                                        console.log('error : ' + JSON.stringify(error));
                                    })
                            }
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        "name": state.name,
                        "description": state.description,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "groupCode": {
                            "code": state.groupCode.code,
                        },
                        "period": state.period,
                        "startDate": state.startDate,
                        "endDate": state.endDate,
                        "startHour": state.startHour,
                        "endHour": state.endHour,
                        "timePeriod": state.timePeriod,
                        "image": [''],
                        "usable": state.usable
                    }
                    axios
                        .post(`/community/reservation/item`, body)
                        .then((response) => {
                            if (response.status === 200 || response.status === 201) {
                                let holidayBody = {};
                                const list = state.newHoliday.map(hDay => {
                                    holidayBody = {
                                        "holiday": hDay.holiday,
                                    }
                                    return axios.post(`/community/reservation/item/${response.data.itemId}/holiday`, holidayBody)
                                });
                                axios
                                    .all(list)
                                    .then((response2) => {
                                        callback(response);
                                    })
                                    .catch((error) => {
                                        console.log('error : ' + JSON.stringify(error));
                                    })
                            }
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                "name": state.name,
                "description": state.description,
                "customer": {
                    "code": state.customer.code,
                    "name": state.customer.name,
                },
                "site": {
                    "code": state.site.code,
                    "name": state.site.name,
                },
                "groupCode": {
                    "code": state.groupCode.code,
                },
                "period": state.period,
                "startDate": state.startDate,
                "endDate": state.endDate,
                "startHour": state.startHour,
                "endHour": state.endHour,
                "timePeriod": state.timePeriod,
                "image": [],
                "usable": state.usable
            }
            axios
                .post(`/community/reservation/item`, body)
                .then((response) => {
                    if (response.status === 200 || response.status === 201) {
                        let holidayBody = {};
                        const list = state.newHoliday.map(hDay => {
                            holidayBody = {
                                "holiday": hDay.holiday,
                            }
                            return axios.post(`/community/reservation/item/${response.data.itemId}/holiday`, holidayBody)
                        });
                        axios
                            .all(list)
                            .then((response2) => {
                                callback(response);
                            })
                            .catch((error) => {
                                console.log('error : ' + JSON.stringify(error));
                            })
                    }
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    //커뮤니티 - 예약 수정
    updateReservation(state, callback) {
        if (state.imageDataUrl !== '') {
            this.reservationImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.imageId;
                    const body = {
                        "name": state.name,
                        "description": state.description,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "groupCode": {
                            "code": state.groupCode.code,
                        },
                        "period": state.period,
                        "startDate": state.startDate,
                        "endDate": state.endDate,
                        "startHour": state.startHour,
                        "endHour": state.endHour,
                        "timePeriod": state.timePeriod,
                        "image": [imageId],
                        "usable": state.usable
                    }
                    axios
                        .put(`/community/reservation/item/${state.itemId}`, body)
                        .then((response) => {
                            if (response.status === 200) {
                                this.updateRegistRemoveHoliday(state, (cb) => {
                                    if (cb) {
                                        callback(response);
                                    }
                                });
                            }
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    const body = {
                        "name": state.name,
                        "description": state.description,
                        "customer": {
                            "code": state.customer.code,
                            "name": state.customer.name,
                        },
                        "site": {
                            "code": state.site.code,
                            "name": state.site.name,
                        },
                        "groupCode": {
                            "code": state.groupCode.code,
                        },
                        "period": state.period,
                        "startDate": state.startDate,
                        "endDate": state.endDate,
                        "startHour": state.startHour,
                        "endHour": state.endHour,
                        "timePeriod": state.timePeriod,
                        "image": [''],
                        "usable": state.usable
                    }
                    axios
                        .put(`/community/reservation/item/${state.itemId}`, body)
                        .then((response) => {
                            if (response.status === 200) {
                                this.updateRegistRemoveHoliday(state, (cb) => {
                                    if (cb) {
                                        callback(response);
                                    }
                                });
                            }
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            const body = {
                "name": state.name,
                "description": state.description,
                "customer": {
                    "code": state.customer.code,
                    "name": state.customer.name,
                },
                "site": {
                    "code": state.site.code,
                    "name": state.site.name,
                },
                "groupCode": {
                    "code": state.groupCode.code,
                },
                "period": state.period,
                "startDate": state.startDate,
                "endDate": state.endDate,
                "startHour": state.startHour,
                "endHour": state.endHour,
                "timePeriod": state.timePeriod,
                "image": state.image ? state.image : [],
                "usable": state.usable
            }
            axios
                .put(`/community/reservation/item/${state.itemId}`, body)
                .then((response) => {
                    if (response.status === 200) {
                        this.updateRegistRemoveHoliday(state, (cb) => {
                            if (cb) {
                                callback(response);
                            }
                        });
                    }
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    updateRegistRemoveHoliday(state, cb) {
        let result = true;
        const originHoliday = state.holiday;
        const newHoliday = state.newHoliday;

        const originHolidayList = [];
        const newHolidayList = [];
        newHoliday.map(items => {
            const holiday = items.holiday;
            newHolidayList.push(holiday);
        });

        originHoliday.map(items => {
            const holiday = items.holiday;
            originHolidayList.push(holiday);
        });

        //휴일 삭제
        const removeTargetList = [];
        originHolidayList.map(holiday => {
            // newHolidayList안에 originHoliday의 특정 일자가 없다.
            if (newHolidayList.indexOf(holiday) === -1) {
                removeTargetList.push(holiday);
            }
        });

        const removeTargetInfoDataList = [];
        originHoliday.map(data => {
            const holiday = data.holiday;
            if (removeTargetList.includes(holiday)) {
                removeTargetInfoDataList.push(data);
            }
        })

        const removeList = removeTargetInfoDataList.map((day) => {
            return axios.delete(`/community/reservation/item/${day.itemId}/holiday/${day.id}`)
        });
        axios
            .all(removeList)
            .then((response) => {
            })
            .catch((error) => {
                result = false;
                console.log('error : ' + JSON.stringify(error));
            })

        //휴일 등록
        let insertHolidayBody = {};
        const insertList = newHolidayList.map(newHoliday => {
            if (originHolidayList.indexOf(newHoliday) === -1) {
                insertHolidayBody = {
                    "holiday": newHoliday,
                }
                return axios.post(`/community/reservation/item/${state.itemId}/holiday`, insertHolidayBody)
            }
        });
        axios
            .all(insertList)
            .then((response) => {
            })
            .catch((error) => {
                result = false;
                console.log('error : ' + JSON.stringify(error));
            })

        cb(result);
    },

    //커뮤니티 - 예약 삭제
    removeReservation(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/community/reservation/item/${code.itemId}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    //커뮤니티 - 주민투표 목록 검색 
    getVoteList(pageState, callback) {
        let searchCondition = "";
        searchCondition += pageState.searchCategory1 ? "&customer.code=" + pageState.searchCategory1 : '';
        searchCondition += pageState.searchCategory2 ? "&site.code=" + pageState.searchCategory2 : '';
        searchCondition += pageState.searchCategory3 ? "&status=" + pageState.searchCategory3 : '';
        searchCondition += pageState.searchText ? "&title=" + pageState.searchText : '';
        axios
            .get(`/community/vote?page=${pageState.currentPage}&sizePerPage=${pageState.rowPerPage}${searchCondition}`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 주민투표 상세 검색 
    getVoteOne(voteId, callback) {
        axios
            .get(`/community/vote/${voteId}`)
            .then((response) => {
                if (response.data.image) {
                    this.getVoteImg(response.data.image, (response2) => {
                        if (response2.status === 200) {
                            const imageDataUrl = response2.data;
                            const resData = {
                                data: {
                                    ...response.data,
                                    imageDataUrl: imageDataUrl,
                                },
                                status: 200,
                            }
                            callback(resData);
                        }
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    getVoteResult(voteId, callback) {
        axios
            .get(`/community/vote/${voteId}/result`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    getVoteCountList(voteId, callback) {
        axios
            .get(`/community/vote/${voteId}/count`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    getVoteAgendaList(voteId, callback) {
        axios
            .get(`/community/vote/${voteId}/agenda`)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    getVoteAgendaOne(form, callback) {
        axios
            .get(`/community/vote/${form.voteId}/agenda/${form.agendaId}`)
            .then((response) => {
                if (response.data.image) {
                    this.getVoteImg(response.data.image, (response2) => {
                        if (response2.status === 200) {
                            const imageDataUrl = response2.data;
                            const resData = {
                                data: {
                                    ...response.data,
                                    imageDataUrl: imageDataUrl,
                                },
                                status: 200,
                            }
                            callback(resData);
                        }
                    });
                } else {
                    callback(response);
                }
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    //커뮤니티 - 예약 등록
    addVote(state, callback) {
        const body = {
            "title": state.title,
            "contents": state.contents,
            "customer": {
                "code": state.customer.code,
                "name": state.customer.name,
            },
            "site": {
                "code": state.site.code,
                "name": state.site.name,
            },
            "classification": state.classification,
            "dong": state.dong ? state.dong : "ALL",
            "voteStartDate": state.voteStartDate,
            "voteEndDate": state.voteEndDate,
            "startDate": state.startDate,
            "image": [],
            "publicYn": state.publicYn
        }
        if (state.imageDataUrl !== '') {
            this.voteImgUpload(state, (response) => {
                if (response.status === 200 || response.status === 201) {
                    const imageId = response.data.imageId;
                    body.image = [imageId];
                    axios
                        .post(`/community/vote`, body)
                        .then((response) => {
                            if (response.status === 200 || response.status === 201) {
                                state.voteId = response.data.voteId;
                                this.updateRegistRemoveVoteAgenda(state, (cb) => {
                                    if (cb) {
                                        callback(response);
                                    }
                                });
                            }
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    body.image = [''];
                    axios
                        .post(`/community/vote`, body)
                        .then((response) => {
                            if (response.status === 200 || response.status === 201) {
                                state.voteId = response.data.voteId;
                                this.updateRegistRemoveVoteAgenda(state, (cb) => {
                                    if (cb) {
                                        callback(response);
                                    }
                                });
                            }
                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            axios
                .post(`/community/vote`, body)
                .then((response) => {
                    if (response.status === 200 || response.status === 201) {
                        state.voteId = response.data.voteId;
                        this.updateRegistRemoveVoteAgenda(state, (cb) => {
                            if (cb) {
                                callback(response);
                            }
                        });
                    }
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    //커뮤니티 - 예약 수정
    updateVote(state, callback) {
        const body = {
            "title": state.title,
            "contents": state.contents,
            "customer": {
                "code": state.customer.code,
                "name": state.customer.name,
            },
            "site": {
                "code": state.site.code,
                "name": state.site.name,
            },
            "classification": state.classification,
            "dong": state.dong ? state.dong : "ALL",
            "voteStartDate": state.voteStartDate,
            "voteEndDate": state.voteEndDate,
            "startDate": state.startDate,
            "image": state.image ? state.image : [],
            "publicYn": state.publicYn
        }
        if (state.imageDataUrl !== '') {
            this.voteImgUpload(state, (response) => {
                if (response.status === 200) {
                    const imageId = response.data.imageId;
                    body.image = [imageId];
                    axios
                        .put(`/community/vote/${state.voteId}`, body)
                        .then((response) => {
                            if (response.status === 200) {
                                this.updateRegistRemoveVoteAgenda(state, (cb) => {
                                    if (cb) {
                                        callback(response);
                                    }
                                });
                            }

                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                } else if (response === 'error') {
                    body.image = [''];
                    axios
                        .put(`/community/vote/${state.voteId}`, body)
                        .then((response) => {
                            if (response.status === 200) {
                                this.updateRegistRemoveVoteAgenda(state, (cb) => {
                                    if (cb) {
                                        callback(response);
                                    }
                                });
                            }

                        })
                        .catch((error) => {
                            console.log('error : ' + JSON.stringify(error));
                        })
                }
            });
        } else {
            axios
                .put(`/community/vote/${state.voteId}`, body)
                .then((response) => {
                    if (response.status === 200) {
                        this.updateRegistRemoveVoteAgenda(state, (cb) => {
                            if (cb) {
                                callback(response);
                            }
                        });
                    }
                })
                .catch((error) => {
                    console.log('error : ' + JSON.stringify(error));
                })
        }
    },

    // 커뮤니티 - 투표 이미지 가져오기
    getVoteImg(image, callback) {
        axios
            .get(`/community/vote/image/view/${image}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                response.data = imageEncode(response.data);
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 커뮤니티 - 투표 이미지업로드
    voteImgUpload(formData, callback) {
        let blob = dataURLtoBlob(formData.imageDataUrl);
        let form = new FormData()
        form.append('image', blob);

        axios
            .post(`/community/vote/image`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    //커뮤니티 - 투표 안건 수정, 삭제, 등록
    updateRegistRemoveVoteAgenda(state, cb) {
        let result = true;

        //안건 삭제
        const removeAgendaList = state.removeAgendaList;
        const removeList = removeAgendaList.map(agendaId => {
            return axios.delete(`/community/vote/${state.voteId}/agenda/${agendaId}`)
        });
        axios
            .all(removeList)
            .then((response) => {
            })
            .catch((error) => {
                result = false;
                console.log('error : ' + JSON.stringify(error));
            })

        //안건 등록
        const newAgenda = state.newAgenda;
        const insertList = newAgenda.map((agenda, idx) => {
            const voteNum = idx + 1;
            agenda.voteNum = voteNum;
            if (!agenda.agendaId) {
                if (agenda.imageDataUrl) {
                    this.voteImgUpload(agenda, (response) => {
                        if (response.status === 200) {
                            const imageId = response.data.imageId;
                            const insertBody = {
                                "title": agenda.title,
                                "contents": agenda.contents,
                                "image": [imageId],
                                "voteNum": agenda.voteNum,
                            }

                            return axios.post(`/community/vote/${state.voteId}/agenda`, insertBody);
                        } else if (response === 'error') {
                            const insertBody = {
                                "title": agenda.title,
                                "contents": agenda.contents,
                                "image": [''],
                                "voteNum": agenda.voteNum,
                            }

                            return axios.post(`/community/vote/${state.voteId}/agenda`, insertBody);
                        }
                    });
                } else {
                    const insertBody = {
                        "title": agenda.title,
                        "contents": agenda.contents,
                        "image": agenda.image ? agenda.image : [],
                        "voteNum": agenda.voteNum,
                    }
                    return axios.post(`/community/vote/${state.voteId}/agenda`, insertBody);
                }
            }
        });
        axios
            .all(insertList)
            .then((response) => {
            })
            .catch((error) => {
                result = false;
            })

        const updateList = newAgenda.map((agenda, idx) => {
            if (agenda.agendaId) {

                if (agenda.imageDataUrl) {
                    this.voteImgUpload(agenda, (response) => {
                        if (response.status === 200) {
                            const imageId = response.data.imageId;
                            const updateBody = {
                                "title": agenda.title,
                                "contents": agenda.contents,
                                "image": [imageId],
                                "voteNum": agenda.voteNum
                            }

                            return axios.put(`/community/vote/${state.voteId}/agenda/${agenda.agendaId}`, updateBody);
                        } else if (response === 'error') {
                            const updateBody = {
                                "title": agenda.title,
                                "contents": agenda.contents,
                                "image": [''],
                                "voteNum": agenda.voteNum
                            }

                            return axios.put(`/community/vote/${state.voteId}/agenda/${agenda.agendaId}`, updateBody);
                        }
                    });
                } else {
                    const updateBody = {
                        "title": agenda.title,
                        "contents": agenda.contents,
                        "image": agenda.image ? agenda.image : [],
                        "voteNum": agenda.voteNum
                    }

                    return axios.put(`/community/vote/${state.voteId}/agenda/${agenda.agendaId}`, updateBody);
                }
            }
        });
        axios
            .all(updateList)
            .then((response) => {
            })
            .catch((error) => {
                result = false;
            })

        cb(result);
    },

    //커뮤니티 - 투표 삭제
    removeVote(items, callback) {
        const list = items.map(code => {
            return axios.delete(`/community/vote/${code.voteId}`)
        });

        axios
            .all(list)
            .then((response) => {
                callback(true);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            });
    },

    cloudnLogin(user, callback) {

        let form = new FormData()
        form.append('phone', user.phone);
        form.append('pwd', user.pwd);

        axios
            .post(store.cloudn_api + `/login`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },
    getCloudnDevices(request, callback) {

        let form = new FormData()
        form.append('salt', request.salt);

        axios
            .post(store.cloudn_api + `/device/list`, form)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    },

    // 장소 - 현장 장소 추가
    addPlace(state, callback) {
        const body = {
            ...state
        }

        axios
            .post(`/places`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    // 장소 - 현장 장소 추가
    getPlace(params, callback) {
        const queryString = params.username ? `?username=${params.username}` : '';
        axios
            .get(`/places` + queryString)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
            })
    },

    addDeviceByODP(state, callback) {
        const body = {
            ...state
        }

        axios
            .post(store.odp_api + `/indoor/device`, body)
            .then((response) => {
                callback(response);
            })
            .catch((error) => {
                console.log('error : ' + JSON.stringify(error));
                if (error.name === 'Error') {
                    callback('error');
                }
            })
    }
}