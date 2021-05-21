import React, {useEffect, useState} from 'react'
import Table from "../../../UI/organisms/Table";
import Net from "../../../actions/net";
import {DataGrid} from "@material-ui/data-grid";
import TableGrid from "../../../UI/molecules/Table/TableGrid";

const columnList = [
    {
        field: 'id',
        headerName: 'noticeId',
        width: 150,
        hide: true,
    },
    {
        field: 'classificationName',
        headerName: 'classificationKOR',
        width: 150,
    },
    {
        field: 'title',
        headerName: 'title',
        width: 150,
    },
    {
        field: 'viewDate',
        headerName: 'viewDate',
        width: 150,
    },
    {
        field: 'mainNotice',
        headerName: 'mainNotice',
        width: 150,
    },
    {
        field: 'dongHo',
        headerName: 'dongHo',
        width: 150,
    },
    {
        field: 'siteName',
        headerName: 'site.name',
        width: 150,
    },
    {
        field: 'customerName',
        headerName: 'customer.name',
        width: 150,
    },
    {
        field: 'publicYn',
        headerName: 'publicYn',
        width: 150,
    },
];

export const Test = () => {

    const [contentData, setContentData] = useState([]);
    const [programAuth, setProgramAuth] = useState({});


    // table Data : Get
    useEffect(() => {
        loadData();
    }, []);


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
        <>
            <TableGrid rows={contentData} columns={columnList} checkboxSelection={true} />
        </>
    );
}