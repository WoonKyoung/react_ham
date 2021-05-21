import React, { Fragment, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom'
import store from '../../../../stores/store';
import Net from '../../../../actions/net';
import {SearchInputBar} from "../../../../UI/atoms/SearchInputBar/SearchInputBar";
import {CustomTable} from "../../../../UI/atoms/Table/CustomTable";

const columnList = [
    {
        code: 'noticeId',
        title: 'noticeId',
        width: '8',
        hidden: true,
    },
    {
        code: 'classificationKOR',
        title: '구분',
        width: '8',
    },
    {
        code: 'title',
        title: '제목',
        width: '20',
    },
    {
        code: 'viewDate',
        title: '공개기간',
        width: '18',
    },
    {
        code: 'mainNotice',
        title: '중요공지',
        width: '5',
    },
    {
        code: 'dongHo',
        title: '장소',
        width: '8',
    },
    {
        code: 'site.name',
        title: '현장명',
        width: '10',
    },
    {
        code: 'customer.name',
        title: '고객사',
        width: '8',
    },
    {
        code: 'publicYn',
        title: '사용여부',
        width: '5',
    },
];

export const NoticeList = (props) => {
    // useHistory 선언
    const history = useHistory();

    const [programAuth, setProgramAuth] = useState({});
    const [contentData, setContentData] = useState([]);
    const [checkedList, setCheckedList] = useState([]);
    const [noticeDetail, setNoticeDetail] = useState([]);

    const [searchCategory, setSearchCategory] = useState([
        [
            [
                {code: '', name: '고객사 선택'}
            ]
        ],
        [
            [
                {code: '', name: '현장명 선택'}
            ]
        ],
        [
            [
                {code: '', name: '구분 선택'}
            ]
        ],
    ]);

    const [pageState, setPageState] = useState({
        currentPage: 0,
        rowPerPage: 13,
        totalElementsCnt: 0,
        drawElementsCnt: 0,
        searchText: '',
        searchCategory1: '',
        searchCategory2: '',
        searchCategory3: '',
    });

    useEffect(() => {
        store.openedPage = '공지사항 목록';
        getCategoryList('');
        pageAuthInfo();
    }, [])

    useEffect(() => {
        getClassificationList(response => {
            loadData(response.data)

        });
    }, [pageState.currentPage,
        pageState.searchCategory1,
        pageState.searchCategory2,
        pageState.searchCategory3,
    ]);

    const pageAuthInfo = () => {
        const authGroupCode = props.userInfo.authList[0];
        const menuId = sessionStorage.getItem('menuId');

        Net.getAuthGroupMenuList(menuId, (response) => {
            if(response.status === 200) {
                response.data.map(item => {
                    if(item.authGroup === authGroupCode && item.authGroupMenu) {
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

    const loadData = (codeList) => {
        Net.getNoticeList(
            {   
                currentPage: pageState.currentPage,
                rowPerPage: pageState.rowPerPage, 
                searchText: pageState.searchText, 
                searchCategory1: pageState.searchCategory1, 
                searchCategory2: pageState.searchCategory2,
                searchCategory3: pageState.searchCategory3
            }, (response) => {
            if(response.status === 200) {
                let dongHo;
                response.data.content.map((item, i) => {
                    if( item.dong !== "ALL" ){

                        dongHo = item.dong + "동 ";
                    } else if( item.ho !== "ALL" ){
                        dongHo += item.ho + "호";
                    } else {
                        dongHo = "";
                    }
                    item.dongHo = dongHo;

                    if( item.mainNotice ){

                        item.mainNotice = "중요";
                    } else {
                        item.mainNotice = "일반";
                    }
                    if( item.publicYn ){

                        item.publicYn = "사용";
                    } else {
                        item.publicYn = "사용안함";
                    }
                    item.viewDate = item.startDate + " ~ " + item.endDate;

                    codeList.map(cItem => {

                        if( item.classification === cItem.code ){
                            item.classificationKOR = cItem.name;
                        }
                    })

                })
                setContentData(response.data.content);
            }
            });
    }

    const getClassificationList = (callback) => {

        Net.getCommunityCode(
            "NOTICE_CLASSIFICATION", (response) => {

                if(response.status === 200) {
                    let newArray = [{code:'',name:"구분 선택"}];
                    response.data.map(items => {
                        if( items.usable ){
                            newArray = [
                                ...newArray,
                                {
                                    code: items.code,
                                    name: items.name
                                }
                            ]
                        }                        
                    })
                    callback({status: 200, data: newArray});
                }
            }
        )
    }

    const getCategoryList = () => {
        let response3 = [];
        getClassificationList(response => {
            if(response.status === 200) {
                response3 = response.data;
                getCustomerList((response1) => {
                    getSitesList(null, (response2) => {
                        setSearchCategory([response1, response2, response3]);
                    });
                });
            }
        });
    }

    const getRelateCategory = (selectedCategory) => {
        if(selectedCategory === "reset") selectedCategory = "";  
        getSitesList(selectedCategory, (response2) => {
            setSearchCategory([
                searchCategory[0],
                response2,
                searchCategory[2]
            ]);
        });
    }

    const getCustomerList = (callback) => {
        Net.getCustomerList(
            {currentPage: '', rowPerPage: '', searchText: ''}, (response) => {
            if(response.status === 200) {
                let newArray = searchCategory[0][0];
                response.data.content.map(items => {
                    newArray = [
                        ...newArray,
                        {
                            code: items.code,
                            name: items.name
                        }
                    ]
                });
                callback(newArray);
            } 
        });
    }

    const getSitesList = (selectedCategory, callback) => {
        if(selectedCategory){
            Net.getSitesList(
                {currentPage: '', rowPerPage: '', searchText: '', customerCode: selectedCategory?selectedCategory:false}, (response) => {
                 if(response.status === 200) {
                     let newArray =  [{code:'',name:"현장명 선택"}];
                     if(response.data.content.length > 0) {
                         response.data.content.map(items => {
                             newArray = [
                                 ...newArray,
                                 {
                                     code: items.code,
                                     name: items.name
                                 }
                             ]
                             
                         })
                     } 
                    callback(newArray);
                 } else {
                     let newArray = [{code:'',name:"현장명 선택"}];
                     callback(newArray);
                 }
            });
        } else {
            let newArray = [{code:'',name:"현장명 선택"}];
            callback(newArray);
        }
    }

    const onClickRow = (e) => {
        Net.getNoticeOne(e.noticeId, (response) => {
            if(response.status === 200) {
                setNoticeDetail(response.data);
            }
        });
    }

    const onMovePage = (e) => {
        setPageState({
            ...pageState,
            currentPage: e-1
        });
    }

    const removeList = () => {
        const result = window.confirm('삭제하시겠습니까?');
        const removeList = [];
        checkedList.map((id) => {
            const node = document.querySelector(`#${id}`);
            const nodeTr = node.closest('tr');
            const noticeId = nodeTr.querySelector('td[name=noticeId]').textContent;
            removeList.push({noticeId: noticeId});
        });
        if(result) {
            Net.removeNotice(removeList, (response) => {
                if(response) {
                    getClassificationList((response) => loadData(response.data));
                }
            });
        }
    }

    const onSubmitHandler = (e) => {
        setPageState({
            ...pageState,
            searchCategory1: e.selectedCategory[0],
            searchCategory2: e.selectedCategory[1],
            searchCategory3: e.selectedCategory[2],
        });
    }

    const addList = () => {
        history.push('/community/notice/regist');
    }

    const goModifypage = () => {
        history.push(`/community/notice/regist/${noticeDetail.noticeId}`);
    }

    return (
        <div className="w-100 h-100">
            <div className="w-100 h-7 display_table">
                <SearchInputBar
                    className="w-100"
                    searchCategory={true}
                    searchCategoryGroup={searchCategory}
                    searchBtn={true}
                    searchBtnTitle="검색"
                    dynamicSearch={false}
                    relateCategoryHandler={getRelateCategory}
                    onSubmit={onSubmitHandler}
                />
                {
                    programAuth.saveAuth &&
                    <div className="display_table_cell v-middle">
                        <button 
                            className="addBtn w-90px h-30px floatR mr-20"
                            onClick={addList}
                        >등록</button>
                    </div>

                }
                
            </div>
            <div className="w-100 h-1px bgC-efefef" />
            <div className="flex h-93">
                <div className="w-70 h-100">
                    <p className="totalCnt">Total {pageState.totalElementsCnt}</p>
                    {
                        programAuth.deleteAuth && checkedList.length > 0 && 
                        <button 
                            className="removeBtn w-90px h-30px floatR mt-7 mr-15"
                            onClick={removeList}
                        >삭제</button>
                    }
                    <CustomTable
                        columnList = {columnList}
                        contentData = {contentData}
                        paging = {true}
                        checkbox = {true}
                        checkedList = {(checkedList) => {setCheckedList(checkedList)} }
                        totalElementsCnt = {pageState.totalElementsCnt}
                        rowPerPage = {pageState.rowPerPage}
                        currentPage = {pageState.currentPage}
                        drawElementsCnt = {pageState.drawElementsCnt}
                        pagination = {onMovePage}
                        rowClickEvt = {true}
                        onClickRow = {onClickRow}
                        // sort = {true}
                    />
                </div>
                <div className="w-30 h-100">
                    <div className="flex">
                        <p className="body_content_subtitle">내용</p>
                        {
                            noticeDetail.contents ?
                            (
                                <button 
                                className="defaultBtn bgC-eb878c borderC-eb878c w-90px h-30px mr-20 mt-auto mb-auto ml-auto"
                                onClick={goModifypage}
                                >수정</button>
                            ) : ""
                        }
                        
                    </div>
                    <div className="w-100 h-100">
                        <table className="mainTable">
                            <thead className="tableHead">
                                <tr>
                                    <th>내용</th>
                                </tr>
                            </thead>
                            <tbody className="tableBody">
                                {
                                    noticeDetail.contents ?
                                    (
                                        <Fragment>
                                            <tr>
                                                <td style={{padding:"10px", overflow:"unset", whiteSpace:"initial"}}>
                                                    <div className="overFlowYscrollView h-60vh">
                                                        <div dangerouslySetInnerHTML={{__html: noticeDetail.contents}}></div>
                                                        {   
                                                            noticeDetail.imageDataUrl &&
                                                            <div className="mt-10">             
                                                                <img src={noticeDetail.imageDataUrl} alt="complex=Img" width="300px"/>                                                           
                                                            </div>
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            
                                        </Fragment>
                                        
                                        
                                    ) : ( 
                                        <tr className="row"><td>조회 된 데이터가 없습니다.</td></tr>
                                    )
                                }
                                
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}