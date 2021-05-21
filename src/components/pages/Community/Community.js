import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { NoticeList, NoticeRegist } from './Notice';

export const Community = ({userInfo}) => {
    return (
        <Switch>
            <Route path={"/community/notice/list"} exact children={<NoticeList userInfo={userInfo} />}/>
            <Route path={"/community/notice/regist"} exact children={<NoticeRegist/>}/>
            <Route path={"/community/notice/regist/:noticeId"} children={<NoticeRegist/>} />
            <Route path={"*"}>
                <Redirect to={"/not-found2"} />
            </Route>
        </Switch>
    )
}  