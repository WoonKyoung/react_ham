import React, { useState } from 'react';
import classNames from 'classnames';
import {useHistory} from "react-router-dom";
import store from '../../../stores/store';
import Net from '../../../actions/net';
import './Header.scss';


export const Header = () => {
    const userInfo = JSON.parse(sessionStorage.getItem('user'));
    const history = useHistory();

    const [toggleUserInfo, setToggleUserInfo] = useState(false);

    const isAuthenticated = store.isAuthorized || sessionStorage.getItem('isAuthorized');

    const handleLogout = () => {
        Net.logout((response) => {
            if(response.status === 200) {
                history.replace("/");
            }
        })
    };

    const toggleUserInfoBtn = () => {
        setToggleUserInfo(!toggleUserInfo);
    }

    return (
        <div className="header_bg">
            <div className="m-auto w-210px">
                <p className="fs-22 mt-0 mb-0 ml-20">F O R E N A</p>
            </div>
            <div
                className="flex w-100"
            >
                <div className="ml-20 header_title">
                    <p></p>
                </div>

                <div className="flex ml-auto">
                    <div className="m-auto">
                        <p className="fs-14 mt-0 mb-0 mr-13">한국어</p>
                    </div>
                    <div className="header_line"/>
                    <div className="flex mt-15 mr-15 mb-15 ml-13" onClick={() => toggleUserInfoBtn()}>
                        <img
                            className="header_mask mr-14"
                        />
                        <div className="header_user_info">
                            <p className="fs-14">{store.user.username || userInfo.username}</p>
                            <img
                                className="w-24px h-24px"
                                src="/icon/arrow-down-white.png"
                                alt="arrow-down"
                            />
                        </div>

                        <div className={classNames('header_user_info_pop',
                            {
                                'show' : toggleUserInfo,
                                'hide' : !toggleUserInfo
                            }
                        )}
                        >
                            <div className="info_pop_li mt-12">
                                <p>마이페이지</p>
                            </div>
                            <div className="info_pop_li" onClick={() => handleLogout()}>
                                <p>로그아웃</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};