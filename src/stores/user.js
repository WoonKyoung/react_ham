import {observable } from 'mobx';

const user = observable({
    user: {
        username: null,
        nickname: null,
        name: null,
        contact: null,
        phoneNumber: null,
        agreeList: null,
        customer: null,
        site: null,
        place: null,
        menuGroup: null,
        roleList: null,
        email: null,
        status: null,
    }
});

export { user };