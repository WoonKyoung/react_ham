
import * as React from 'react';
import PropTypes from 'prop-types';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { createMuiTheme } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import {DataGrid} from "@material-ui/data-grid";
import {useEffect, useState} from "react";
import store from 'stores/store';


export default function TableGrid(props){
    const [programAuth, setProgramAuth] = useState({});

    useEffect(()=> {
        getPageAuthInfo();

    },[]);

    // 해당 페이지의 유저 권한 Get
    const getPageAuthInfo = () =>{
        const authGruopCode = store.user.menuGroup;
        console.log(authGruopCode);
        console.log(store.user);
        console.log('storeuser', store.user['username']);

    };
    return(
        <>
            <div style={{height: 400, width: "100%"}}>
                <DataGrid rows={props.rows} columns={props.columns} rowHeight={25} checkboxSelection={props.checkboxSelection}/>
            </div>

        </>
    );
}