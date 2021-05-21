import React, {useEffect} from 'react';
import {store} from '../../scripts/store';
import {Redirect, Route, Switch} from "react-router-dom";
import Overview from "../Overview/Overview";
import BookList from "../Book/BookList";
import About from "../About";
import BookDetails from "../Book/BookDetails";
import Orders from "../Orders/Orders";
import Schedule from "../Schedule/Schedule";

const MainRouting = () => {
    return (
        <>
            <Switch>
                <Route path="/" exact>
                    <About/>
                </Route>
                <Route path="/book" exact>
                    <BookList/>
                </Route>
                <Route path="/book/:id" exact>
                    <BookDetails/>
                </Route>
                <Route path="/orders" exact>
                    <Orders/>
                </Route>
                <Route path="/overview" exact>
                    <Overview/>
                </Route>
                <Route path="/schedule" exact>
                    <Schedule/>
                </Route>
            </Switch>
        </>
    );
};

export default MainRouting;