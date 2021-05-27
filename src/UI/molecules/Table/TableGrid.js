import * as React from 'react';

import {
    DataGrid,
    GridColumnsToolbarButton, GridDensitySelector,
    GridFilterToolbarButton, GridTableRowsIcon,
    GridToolbar,
    GridToolbarContainer, GridToolbarExport
} from "@material-ui/data-grid";
import {useCallback, useEffect, useState} from "react";
import {useHistory} from 'react-router-dom'
import store from 'stores/store';
import Net from 'actions/net';
import {FormControlLabel, IconButton} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from '@material-ui/icons/Delete';


const MatEdit = ({index, editColor}) => {
    const handleEditClick = () => {
        // some action

        alert("수정 중인 인덱스");
    };

    return (
        <FormControlLabel
            control={
                <IconButton
                    aria-label="add an alarm"
                    onClick={handleEditClick}
                >
                    <EditIcon style={{
                        display: (editColor.get(index) === true) ? "inline-block" : "none"
                    }}/>
                </IconButton>
            }
        />
    );
};

const CustomToolbar = () => {
    return(
        <GridToolbarContainer>
            <GridFilterToolbarButton />
            <GridToolbarExport />
        </GridToolbarContainer>
    );
}
//Email Validation
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

const TableGrid = (props) => {
    const [editRowsModel, setEditRowsModel] = useState({});
    const [editColor, setEditColor] = useState(new Map());
    const [selectionModel, setSelectionModel] = React.useState({});
    const [modalState, setModalState] = useState({
        open: false,
        data: [],
        form: [],
    });

    const history = useHistory();


    // 그리드 인라인 수정시 콜백 함수
    const handleEditCellChange = React.useCallback(
        ({id, field, props}) => {
            if (field === 'email') {
                const data = props; // Fix eslint value is missing in prop-types for JS files
                const newState = {};
                const isValid = validateEmail(data.value);
                newState[id] = {
                    ...editRowsModel[id],
                    email: { ...props, error: !isValid },
                };
                setEditRowsModel((state) => ({...state, ...newState}));
            }
            setEditColor((prev) => new Map([...prev, [id, true]]));
        },
        [editRowsModel],
    );


    // 마지막 Column 에 삭제 기능 및 아이콘 추가
    const columns = [
        ...props.columns,
        {
            field: "actions",
            headerName: "수정 상태",
            sortable: false,
            width: 140,
            disableClickEventBubbling: true,
            renderCell: (params) => {
                return (
                    <>
                        <div
                            className="d-flex justify-content-between align-items-center"
                            style={{cursor: "pointer"}}
                        >
                            <MatEdit index={params.row.id} editColor={editColor}/>
                        </div>
                    </>
                );
            }
        }
    ];

    const addList = () => {
        onClickModalOpen({});
    }
    const onClickModalOpen = (form) => {
        setModalState({
            ...modalState,
            open: !modalState.open,
            form: form
        });
    }
    const sendData = (e) => {
        setModalState({
            ...modalState,
            data: e,
        })
    }

    const removeList = () => {
        const result = window.confirm('삭제하시겠습니까?');
        const removeList = [];
        selectionModel.map((id) => {
            const noticeId = id.noticeId;
            removeList.push({noticeId: noticeId});
        });
        if (result) {
            Net.removeNotice(removeList, (response) => {
                if (response) {
                    cancelList();
                }
            });
        }
    }

    const cancelList = (prev) =>{
        props.setResetState(!props.resetState);
        setEditColor(new Map());
        setEditRowsModel({});
        setSelectionModel({});

    }

    // Object가 null인지 확인하는 함수
    const isEmptyObject = (param) => {
        return Object.keys(param).length === 0 && param.constructor === Object;
    }


    useEffect(() => {

    }, []);

    return (
        <div className="w-100 h-100">
            <div className="w-100 h-7 display_table">
                {
                    props.programAuth.saveAuth &&
                        <button
                            className="addBtn w-90px h-30px floatR"
                            onClick={addList}
                        >등록
                        </button>
                }
                {
                    props.programAuth.deleteAuth && !isEmptyObject(selectionModel) &&
                    <button
                        className="removeBtn w-90px h-30px floatR"
                        onClick={removeList}
                    >삭제</button>
                }
                {
                    props.programAuth.saveAuth && (editColor.size > 0)&&
                    <button
                        className="cancelBtn w-90px h-30px floatR"
                        onClick={cancelList}
                    >
                        취소
                    </button>
                }
                {
                    props.programAuth.saveAuth && (editColor.size > 0) &&
                    <button
                        className="downloadBtn w-90px h-30px floatR"
                    >
                        저장
                    </button>
                }


            </div>
            <div style={{ height : 500, width: "100%"}}>
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
                              if (selectedRowData.length === 0) {
                                  setSelectionModel({});
                              }
                              console.log("selected rowData:", selectedRowData);
                          }}
                          isCellEditable={(params) => {
                              if( params.isEditable !== props.programAuth.saveAuth ) return true;
                          }}
                          onRowClick={(params)=>{
                              const selectedID = params.row.noticeId;
                              Net.getNoticeOne(selectedID, (response) => {
                                  if(response.status === 200) {
                                      props.setDetailContent(response.data);
                                  }
                              });
                          }}
                          components={{
                              Toolbar:CustomToolbar,
                          }}
                          disableColumnMenu
                          density
                />
            </div>

        </div>
    );
};

export default TableGrid;