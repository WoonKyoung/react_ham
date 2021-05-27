import React, {useEffect, useState} from 'react'
import Table from "../../../UI/organisms/Table";
import Net from "../../../actions/net";
import store from 'stores/store';
import {DataGrid} from "@material-ui/data-grid";
import TableGrid from "../../../UI/molecules/Table/TableGrid";
import Feed from "../../../UI/molecules/Feed/Feed";

const columnList = [
    {
        field: 'id',
        headerName: 'ID',
        width: 30,
        hide: true,
    },
    {
        field: 'classificationName',
        headerName: '구분',
        width: 110,
        editable: true
    },
    {
        field: 'title',
        headerName: '제목',
        width: 180,
        editable: true
    },
    {
        field: 'viewDate',
        headerName: '공개기간',
        width: 180,
        editable: true
    },
    {
        field: 'mainNotice',
        headerName: '중요여부',
        width: 110,
        editable: true
    },
    {
        field: 'dongHo',
        headerName: '장소',
        width: 110,
        editable: true
    },
    {
        field: 'siteName',
        headerName: '현장명',
        width: 120,
        editable: true
    },
    {
        field: 'customerName',
        headerName: '고객사',
        width: 130,
        editable: true
    },
    {
        field: 'publicYn',
        headerName: '사용여부',
        width: 110,
        editable: true
    },
];

export const Test = () => {
    const [contentData, setContentData] = useState([]);
    const [programAuth, setProgramAuth] = useState({});
    const [resetState, setResetState] = useState(false);
    const [detailContent, setDetailContent] = useState({});

    // table Data : Get
    useEffect(() => {
        store.openedPage = '공지사항 목록';
        getPageAuthInfo();
        loadData();
    }, [resetState]);

    // 해당 페이지의 유저 권한 Get
    const getPageAuthInfo = async () => {
        const userInfo = JSON.parse(sessionStorage.getItem('user'));
        const authGroupCode = userInfo.authList[0];
        const menuId = sessionStorage.getItem('menuId');

        await Net.getAuthGroupMenuList(menuId, (response) => {
            if (response.status === 200) {
                response.data.map(item => {
                    if (item.authGroup === authGroupCode && item.authGroupMenu) {
                        setProgramAuth({
                            searchAuth: Boolean(item.authGroupMenu.searchAuth),
                            saveAuth: Boolean(item.authGroupMenu.saveAuth),
                            excelAuth: Boolean(item.authGroupMenu.excelAuth),
                            deleteAuth: Boolean(item.authGroupMenu.deleteAuth),
                        });
                    }
                });
            }
        });
    }

    const loadData = async () => {
        await Net.getNoticeList({}, (response) => {
            if (response.status === 200) {
                let dongHo;
                response.data.content.map((item, i) => {
                    if (item.dong !== "ALL") {
                        dongHo = item.dong + "동 ";
                    } else if (item.ho !== "ALL") {
                        dongHo += item.ho + "호";
                    } else {
                        dongHo = " ";
                    }
                    item.dongHo = dongHo;

                    if (item.mainNotice) {
                        item.mainNotice = "중요";
                    } else {
                        item.mainNotice = "일반";
                    }
                    if (item.publicYn) {

                        item.publicYn = "사용";
                    } else {
                        item.publicYn = "사용안함";
                    }
                    item.viewDate = item.startDate + " ~ " + item.endDate;
                    item.id = i;
                    item.siteName = item.site.name;
                    item.customerName = item.customer.name;

                })
                console.log(response.data.content)
                setContentData(response.data.content);
            }
        });
    }

    return (
        <div className="flex" >
            <TableGrid
                rows={contentData}
                columns={columnList}
                checkboxSelection={true}
                setContentData={setContentData}
                programAuth={programAuth}
                setResetState={setResetState}
                resetState={resetState}
                setDetailContent={setDetailContent}
                detailContent={detailContent}
            />
            <Feed detailContent={detailContent}/>


        </div>
    );
}