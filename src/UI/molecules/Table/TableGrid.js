
import * as React from 'react';

import {DataGrid} from "@material-ui/data-grid";
import {useEffect, useState} from "react";
import { useHistory } from 'react-router-dom'
import store from 'stores/store';
import Net from 'actions/net';
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
    const [editColor,  setEditColor] = useState(new Map());
    const [selectionModel, setSelectionModel] = React.useState({});

    const history = useHistory();

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

    const addList = () => {
        history.push('/community/notice/regist');
    }

    const removeList = () => {
        const result = window.confirm('삭제하시겠습니까?');
        const removeList = [];
        selectionModel.map((id) => {
            const node = document.querySelector(`#${id}`);
            const nodeTr = node.closest('tr');
            const noticeId = nodeTr.querySelector('td[name=noticeId]').textContent;
            removeList.push({noticeId: noticeId});
        });
        if(result) {
            Net.removeNotice(removeList, (response) => {
                if(response) {
                   // getClassificationList((response) => loadData(response.data));
                }
            });
        }
    }

    const isEmptyObject = (param) => {
        return Object.keys(param).length=== 0 && param.constructor === Object;
    }
    useEffect(()=> {
        getPageAuthInfo();

    },[]);

    // 해당 페이지의 유저 권한 Get
    const getPageAuthInfo = () =>{
        const userInfo = JSON.parse(sessionStorage.getItem('user'));
        const authGroupCode = userInfo.authList[0];
        const menuId = sessionStorage.getItem('menuId');



        Net.getAuthGroupMenuList(menuId, (response) => {
            if(response.status === 200) {
            //    response.data.map(item => {
                    //if(item.authGroup === authGroupCode && item.authGroupMenu) {
                        setProgramAuth({
                            searchAuth: true,
                            saveAuth: true,
                            excelAuth: true,
                            deleteAuth: true,
                        });
                console.log(programAuth);

                //    }
           //     });
            }
        });
        console.log(programAuth);
    };

    return(
        <div className="w-100 h-100">
            <div className="w-100 h-7 display_table">
                {
                    programAuth.saveAuth &&
                    <div className="display_table_cell v-middle">
                        <button
                            className="addBtn w-90px h-30px floatR"
                            onClick={addList}
                        >등록</button>
                    </div>
                }
                {
                    programAuth.deleteAuth && !isEmptyObject(selectionModel) &&
                    <button
                        className="removeBtn w-90px h-30px floatR"
                        onClick={removeList}
                    >삭제</button>
                }

            </div>
            <div style={{height: 400, width: "100%" }}>
                <DataGrid rows={props.rows} columns={columns} rowHeight={25} checkboxSelection={props.checkboxSelection}
                          disableSelectionOnClick
                          editRowsModel={editRowsModel}
                          onEditCellChange={handleEditCellChange}
                          onSelectionModelChange={(e) => {
                              const selectedIDs = new Set(e.selectionModel);
                              const selectedRowData = props.rows.filter((row) =>
                                  selectedIDs.has(row.id)
                              );
                              setSelectionModel(selectedRowData);
                              if(selectedRowData.length ===0){
                                  setSelectionModel({});
                              }
                              console.log("selected rowData:", selectedRowData);

                          }}

                />
            </div>

        </div>
    );
};

export default TableGrid;