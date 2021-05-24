
import * as React from 'react';

import {DataGrid} from "@material-ui/data-grid";
import {useEffect, useState} from "react";
import store from 'stores/store';
import {FormControlLabel, IconButton} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from '@material-ui/icons/Delete';


const MatEdit = ({ index,editColor }) => {
    const handleEditClick = () => {
        // some action

        alert(index);
    };

    return (
        <FormControlLabel
            control={
                <IconButton
                    color="secondary"
                    aria-label="add an alarm"
                    onClick={handleEditClick}
                >
                    <EditIcon style={{
                        color : ( editColor.get(index) === true ) ? "red" : "grey" }} />
                </IconButton>
            }
        />
    );
};

const MatDelete = ({ index }) => {
    const handleDeleteClick = () => {


        alert(index);
    };

    return (
        <FormControlLabel
            control={
                <IconButton
                    color="secondary"
                    aria-label="delete"
                    onClick={handleDeleteClick}
                >
                    <DeleteIcon />
                </IconButton>
            }
        />
    );
};

const TableGrid = (props) => {
    const [programAuth, setProgramAuth] = useState({});
    const [editRowsModel, setEditRowsModel] = useState({});
    const [editColor, setEditColor] = useState(new Map());

    const handleEditCellChange = React.useCallback(
        ({ id, field, props }) => {
            if (field === 'email') {
                const data = props; // Fix eslint value is missing in prop-types for JS files
                const newState = {};
                newState[id] = {
                    ...editRowsModel[id],
                };

                setEditRowsModel((state) => ({ ...state, ...newState }));

            }
            setEditColor((prev)=> new Map([...prev, [id, true]]));

        },
        [editRowsModel],
    );


    const columns = [
        ...props.columns,
        {
            field: "actions",
            headerName: "Actions",
            sortable: false,
            width: 140,
            disableClickEventBubbling: true,
            renderCell: (params) => {
                return (
                    <>
                    <div
                        className="d-flex justify-content-between align-items-center"
                        style={{ cursor: "pointer" }}
                    >
                        <MatEdit index={params.row.id} editColor={editColor}  />
                        <MatDelete index={params.row.id} />
                    </div>


                    </>
                );
            }
        }
    ];

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
                <DataGrid rows={props.rows} columns={columns} rowHeight={25} checkboxSelection={props.checkboxSelection}
                          editRowsModel={editRowsModel}
                          onEditCellChange={handleEditCellChange}        />
            </div>

        </>
    );
};

export default TableGrid;