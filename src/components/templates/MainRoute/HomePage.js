import React, {useEffect} from 'react';
import {store} from '../../../stores/store';
import {Redirect, Route, Switch} from "react-router-dom";
import {Footer} from "../Footer/Footer";
import {Header} from "../Header/Header";
import {Menu} from "../Menu/Menu";
import {PageTemplate} from "../PageTemplate/PageTemplate";
import About from "../../pages/About/About";
import BookList from "../../pages/Book/BookList";
import {Community} from "../../pages/Community/Community";
import {Test} from "../../pages/Test/Test";
import {NotFound} from "../../pages/NotFound/NotFound";
import DeviceStorage from 'react-device-storage';
import {Auth} from "aws-amplify";
import Net from "../../../actions/net";

export const HomePage = () => {

    const [open, setOpen] = React.useState(true);

    const leftMenuhandle = (e) => {
        setOpen(e);
    };

    const isAuthenticated = store.isAuthorized || sessionStorage.getItem('isAuthorized');
    const userInfo = JSON.parse(sessionStorage.getItem('user'));
    console.log(isAuthenticated, userInfo);
    const S = new DeviceStorage().localStorage();
    const token = S.read('token');

    useEffect(()=> {
        if(token){
            getUser();
        }
    },[]);

    const getUser = async ()=> {
        await Net.getMe((res) => {
            console.log("/me", res);
            store.user = res.data;
            store.isAuthorized = true;
            sessionStorage.setItem('user', JSON.stringify(res.data));
            sessionStorage.setItem('isAuthorized', true);
        })
    }

    return (
        <>
            {isAuthenticated ?
                (
                    <PageTemplate
                        header={<Header/>}
                        menu={<Menu onDrawer={leftMenuhandle} userInfo={userInfo}/>}
                        footer={<Footer/>}
                        notFound={false}
                        leftMenu={open}
                    >
                        <Switch>
                            <Route path={"/"} exact>
                                <About/>
                            </Route>
                            <Route path={"/community"} children={<Community userInfo={userInfo}/>}/>
                            <Route path={"/book"} children={<BookList userInfo={userInfo}/>}/>
                            <Route path={"/test"} children={<Test userInfo={userInfo}/>}/>
                            <Route path={"/not-found2"} exact component={NotFound}/>
                            <Route path={"*"}>
                                <Redirect to={"/not-found2"} />
                            </Route>

                        </Switch>
                    </PageTemplate>
                )
                : (
                    <Redirect to={{ pathname: "/login"}}/>
                )
            }
        </>
    );
}