import React, { Fragment, useState, useEffect } from "react";
import classNames from 'classnames';
import './Menu.scss';
import store from '../../../stores/store';
import {ListItemLink} from "../../../UI/molecules";

export const Menu = (props) => {

    const [routes, setRoutes] = useState([]);
    const [leftMenuDisplay, setLeftMenuDisplay] = useState(true);
    const menus = [
        {
            "menuId": "0",
            "menuGroup": "ADMIN",
            "menuName": "소개페이지",
            "level": 0,
            "sort": 1,
            "programCode": "test",
            "program": {
                "code": "test",
                "name": "소개페이지",
                "path": "/",
                "authCheck": true,
                "searchAuth": true,
                "saveAuth": true,
                "excelAuth": false,
                "deleteAuth": true,
                "remark": "string"
            },
        },
        {
            "menuId": "1",
            "menuGroup": "ADMIN",
            "menuName": "커뮤니티",
            "level": 0,
            "sort": 1,
            "children": [
                {
                    "menuId": "6013d582180a3a225433604a",
                    "menuGroup": "ADMIN",
                    "menuName": "공지사항",
                    "parentId": "1",
                    "level": 1,
                    "sort": 2,
                    "programCode": "5ff289ba199dcc12d4f5ba52",
                    "program": {
                        "code": "5ff289ba199dcc12d4f5ba52",
                        "name": "공지사항",
                        "path": "/community/notice/list",
                        "authCheck": true,
                        "searchAuth": true,
                        "saveAuth": true,
                        "excelAuth": false,
                        "deleteAuth": true
                    },
                    "authGroupMenus": [
                        {
                            "id": "6013d81e180a3a2254336071",
                            "authGroup": "MEMBER",
                            "menuId": "6013d582180a3a225433604a",
                            "searchAuth": true,
                            "saveAuth": true,
                            "deleteAuth": true
                        },
                        {
                            "id": "6013d81e180a3a2254336072",
                            "authGroup": "MANAGER",
                            "menuId": "6013d582180a3a225433604a",
                            "searchAuth": true,
                            "saveAuth": true,
                            "deleteAuth": true
                        }
                    ]
                },
                {
                    "menuId": "2",
                    "menuGroup": "ADMIN",
                    "menuName": "현장관리",
                    "parentId": "1",
                    "level": 1,
                    "sort": 2,
                    "children": [
                        {
                            "menuId": "3",
                            "menuGroup": "ADMIN",
                            "menuName": "현장",
                            "parentId": "2",
                            "level": 2,
                            "sort": 1,
                            "programCode": "3",
                            "program": {
                                "code": "3",
                                "name": "현장관리",
                                "path": "/location/site/list",
                                "authCheck": true,
                                "searchAuth": true,
                                "saveAuth": true,
                                "excelAuth": false,
                                "deleteAuth": true
                            }
                        },
                        {
                            "menuId": "4",
                            "menuGroup": "ADMIN",
                            "menuName": "시설물",
                            "parentId": "2",
                            "level": 2,
                            "sort": 2,
                            "programCode": "4",
                            "program": {
                                "code": "4",
                                "name": "현장시설물관리",
                                "path": "/location/facility/list",
                                "authCheck": true,
                                "searchAuth": true,
                                "saveAuth": true,
                                "excelAuth": false,
                                "deleteAuth": true
                            }
                        },
                    ]
                }]
        },
        {
            "menuId": "6013d582180a3a225433604a",
            "menuGroup": "ADMIN",
            "menuName": "테이블 테스트",
            "parentId": "0",
            "level": 0,
            "sort": 1,
            "programCode": "5ff289ba199dcc12d4f5ba52",
            "program": {
                "code": "1",
                "name": "테이블 테스트",
                "path": "/test",
                "authCheck": true,
                "searchAuth": true,
                "saveAuth": true,
                "excelAuth": false,
                "deleteAuth": true,
                "remark": "string"
            },
            "authGroupMenus": [
                {
                    "id": "6013d81e180a3a2254336071",
                    "authGroup": "MEMBER",
                    "menuId": "6013d582180a3a225433604a",
                    "searchAuth": true,
                    "saveAuth": true,
                    "deleteAuth": true
                },
                {
                    "id": "6013d81e180a3a2254336072",
                    "authGroup": "MANAGER",
                    "menuId": "6013d582180a3a225433604a",
                    "searchAuth": true,
                    "saveAuth": true,
                    "deleteAuth": true
                }
            ]
        },

    ];
    useEffect(() => {
        setRoutes(menus);
    }, [])

    useEffect(() => {
        props.onDrawer(leftMenuDisplay);
    }, [leftMenuDisplay])

    const displayHandler = () => {
        setLeftMenuDisplay(!leftMenuDisplay);
    }



    return (
        <Fragment>
            <div className={classNames('menu_bg',
                {'show appear' : leftMenuDisplay,
                    'hidden disappear' : !leftMenuDisplay})}>
                {routes.map((route, index) => {
                    return (
                        <ListItemLink key={index} {...route} />
                        // <ListItemLink_test key={index} {...route} />
                    )
                })}
            </div>
            <div className={classNames('position_abs',
                {'l-210px' : leftMenuDisplay,
                    'l-0px' : !leftMenuDisplay})}>
                <button className="left_menu_show_hide_btn" onClick={displayHandler}>
                    { leftMenuDisplay ? <img className="w-100 h-100" src="/icon/prev.png"/> : <img className="w-100 h-100" src="/icon/next.png"/> }
                </button>
            </div>
        </Fragment>

    );
};