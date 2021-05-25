import {BrowserRouter, Redirect, Route, Switch} from "react-router-dom";
import {CookiesProvider} from "react-cookie";
import {ToasterProvider} from "./UI/atoms/Context/ToasterContext";
import {HomePage} from "./components/templates/MainRoute/HomePage";
import SignIn from "./components/pages/User/SignIn";
import LoginCheck from "./components/pages/User/LoginCheck";
import "./App.scss";
import React from "react";
import {NotFound} from "./components/pages/NotFound/NotFound";

function App() {
    return (
        <CookiesProvider>
            <BrowserRouter>
                <ToasterProvider>
                    <Switch>
                        <Route path={"/login"} exact component={SignIn}/>
                        <Route path="/login/check" exact component={LoginCheck}/>
                        <Route path={"/not-found"} exact component={NotFound}/>
                        <Route path={"/"}>
                            <HomePage/>
                        </Route>
                    </Switch>
                </ToasterProvider>
            </BrowserRouter>
        </CookiesProvider>
    );
}

export default App;
