import React, {useEffect, useReducer, useState} from 'react';
import store from '../../../stores/store';
import Net from '../../../actions/net';
import {Auth, Hub} from 'aws-amplify'
import {Redirect} from "react-router-dom";
import DeviceStorage from "react-device-storage";

const initialUserState = {user: null, loading: true}

function LoginCheck() {
    const [userState, dispatch] = useReducer(reducer, initialUserState);

    useEffect(() => {

        // set listener for auth events
        Hub.listen('auth', (data) => {
            console.log(data);
            const {payload} = data
            if (payload.event === 'signIn') {


                store.isAuthorized = true;
                const accessToken = data.payload.data.signInUserSession.accessToken.jwtToken;
                const refreshToken = data.payload.data.signInUserSession.refreshToken.token;

                store.auth = {
                    token: accessToken,
                    refreshToken: refreshToken
                }

                const S = new DeviceStorage().localStorage();
                S.save('token', accessToken);
                S.save('refreshToken', refreshToken);
            }
            // this listener is needed for form sign ups since the OAuth will redirect & reload
            if (payload.event === 'signOut') {
                setTimeout(() => dispatch({type: 'setUser', user: null}), 350)
            }
        })
        // we check for the current user unless there is a redirect to ?signedIn=true
        if (!window.location.search.includes('?signedin=true')) {
            checkUser(dispatch)
        }
    }, [userState])

    return (
        <>
        {
            userState.user &&  (
                <Redirect to={"/"}/>
            )
        }

        </>
    );
};

function reducer(state, action) {
    switch (action.type) {
        case 'setUser':
            return {...state, user: action.user, loading: false}
        case 'loaded':
            return {...state, loading: false}
        default:
            return state
    }
}

async function checkUser(dispatch) {
    try {
        const user = await Auth.currentAuthenticatedUser()
        await Net.getMe((res) => {
            //console.log("/me", res);
            store.user = (JSON.stringify(res.data));
            sessionStorage.setItem('user', JSON.stringify(res.data));
            sessionStorage.setItem('isAuthorized', true);

            dispatch({type: 'setUser', user})
        })

    } catch (err) {
        console.log('err: ', err)
        dispatch({type: 'loaded'})
    }
}

export default LoginCheck;