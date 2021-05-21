import React, { Fragment, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import './CustomTable.scss';
import { CustomRadioButton } from '../Radio/CustomRadioButton';
import {CustomCheckbox} from "../Checkbox/CustomCheckbox";
import {CustomPagination} from "../Pagination/CustomPagination";

export const CustomTable = (props) => {

    const [contentData, setContentData] = useState([]);
    const [checkedItems, setCheckedItems] = useState([]);
    const [checkedItems2, setCheckedItems2] = useState([]);
    const [rowPerPage, setRowPerPage] = useState(props.rowPerPage);
    const [drawElementsCnt, setDrawElementsCnt] = useState(props.drawElementsCnt);
    const [clickedRowIdx, setClickedRowIdx] = useState(null);
    const [isEditMode, setIsEditMode] = useState(props.isEditMode);

    const history = useHistory();

    useEffect(() => {
        props.firstCheckedData && setCheckedItems(props.firstCheckedData);
    }, [props.firstCheckedData])

    // 페이지당 출력되는 행의 수
    useEffect(() => {
        setDrawElementsCnt(props.drawElementsCnt);
    }, [props.drawElementsCnt])

    // 페이지당 한 화면에 뿌려지는 데이터가 바뀌면 체크 박스를 해제
    useEffect(() => { 
        if(checkedItems.length > 0) {
            checkedItems.map(() => {
                const node = document.querySelectorAll(`table tr td input[type=checkbox][id^='row_']`);
                for(let i=0; i<node.length; i++) {
                    node[i].checked = false;
                }
            });
            setCheckedItems([]);
        }
        setContentData(props.contentData);
        
        if(props.checkedList2) {
            const tempList = [];
            props.contentData.map((list, index) => {
                props.columnList.map((columnData, i) => {

                    const code = columnData.code;
                    switch (code) {
                        case 'authCheck' :
                        case 'searchAuth' :
                        case 'saveAuth' :
                        case 'excelAuth' :
                        case 'deleteAuth' :
                            if(list[code]) {
                                if(!tempList.includes(`${code}_${index}`)) {
                                    tempList.push(`${code}_${index}`);
                                }
                            }
                            break;
                        case 'authGroupMenu' :
                        case 'authGroupMenu.searchAuth' :
                        case 'authGroupMenu.saveAuth' :
                        case 'authGroupMenu.excelAuth' :
                        case 'authGroupMenu.deleteAuth' :
                            let newCode1;
                            let newCode2;
                            if(code.includes('.')) {
                                newCode1 = code.split('.')[0];
                                newCode2 = code.split('.')[1];
                            } else {
                                newCode1 = code;
                            }
                            if(list[newCode1]) {
                                if(!newCode2) {
                                    if(!tempList.includes(`${code}_${index}`)) {
                                        tempList.push(`${code}_${index}`);
                                    }
                                }
                                if(list[newCode1][newCode2]) {
                                    if(!tempList.includes(`${code}_${index}`)) {
                                        tempList.push(`${code}_${index}`);
                                    }
                                }
                            }
                    
                        default:
                            break;
                    }
                });
            });
            setCheckedItems2(tempList);
        }

    }, [props.contentData])

    // 체크되는 항목 부모 컴포넌트로 전달
    useEffect(() => {
        props.checkbox && props.checkedList(checkedItems);
        props.radio && props.checkedList(checkedItems);
    }, [checkedItems]);

    useEffect(() => {
        props.checkedList2 && props.checkedList2(checkedItems2);
    }, [checkedItems2]);
    
    useEffect(() => {
        setIsEditMode(props.isEditMode);
    }, [props.isEditMode]);

    // const [contentDataList, setContentDataList] = useState(props.contentData);
    // const [sortColumnNm, setSortColumnNm] = useState(props.columnList[0].code);
    // const [sortOrder, setSortOrder] = useState(false);
    // const result = contentDataList.sort(function(a, b) {
    //     return a[sortColumnNm] < b[sortColumnNm] ? -1 : a[sortColumnNm] > b[sortColumnNm] ? 1 : 0;
    // });
    // console.log(result);


    // go to detail
    const onClickHandler = (list, index) => {
        setClickedRowIdx(index);
        props.onClickRow(list);
    }

    const tdOnClickHandler = (title, list) => {
        props.tdClickEvt(title, list);
    }

    // Checkbox onChange Event
    const handleCheckbox = (id, checked) => {
        if(checked) {
            setCheckedItems(checkedItems.concat(id));
        } else {
            setCheckedItems(checkedItems.filter(items => items !== id));
        }
    }

    // Checkbox onChange Event
    const handleCheckbox2 = (id, checked) => {
        if(checked) {
            setCheckedItems2(checkedItems2.concat(id));
        } else {
            setCheckedItems2(checkedItems2.filter(items => items !== id));
        }
    }

    const radioBtnHandler = (name, value) => {
        setCheckedItems([value]);
    }

    // Pagination currentPage Number
    const handleOnChgPage = (pageNumber) => {
        props.pagination(pageNumber);
    }

    const onChangeTextHandler = (e) => {
        const targetArray = e.target.name.split('_');
        const code = targetArray[0];
        const rowIdx = targetArray[1];
        contentData[rowIdx][code] = e.target.value;
        setContentData([
            ...contentData,
        ]);
    }

    let columnListLen = 0;
    const colgroup = props.columnList.map((columnData, i) => {
        if(!columnData.hidden) {
            columnListLen++;
            return (<col key={i} width={`${columnData.width}%`}/>)
        }
    });

    const contents = (contentData !== undefined && contentData.length > 0) ? 
        (contentData.map((list, index) => {
            const clickEvt = props.rowClickEvt ? { onClick: () => {onClickHandler(list, index)} } : {};
            return (
                <tr 
                    key={`${list.code}_${index}`} 
                    className={classNames('row', {'clicked': index===clickedRowIdx})}
                    {...clickEvt}
                >
                    {
                        props.checkbox && 
                        <td onClick={ e => e.stopPropagation() }>
                            <CustomCheckbox
                                id={`row_${index}`}
                                className="j-c-c h-16px"
                                title=""
                                checked={checkedItems.includes(`row_${index}`)}
                                disabled={isEditMode ? (list.code === '' ? false : true) : false}
                                onChange={handleCheckbox}
                            />
                        </td>
                    }
                    {
                        props.radio &&
                        <td onClick={ e => e.stopPropagation() }>
                            <CustomRadioButton
                                id={`row_${index}`}
                                name="rowItems"
                                className="j-c-c h-16px"
                                title=""
                                value={`row_${index}`}
                                checked={checkedItems[0] === `row_${index}`}
                                customOnChange={radioBtnHandler}
                            />
                        </td>
                    }
                    {
                        props.columnList.map((columnData, i) => {
                            let resultData;

                            const code = columnData.code;
                            // API 조회 데이터에서 2deps 이상의 데이터를 매핑하기 위해 아래와 같이 함.
                            const tdClickEvt = columnData.tdClickEvent ? { onClick: (e) => { e.stopPropagation(); tdOnClickHandler(columnData.title, list)} } : {};
                            if(code.includes('.')) {
                                let rowData = list;
                                const codeArray = code.split('.');
                                codeArray.map((data, index) => {
                                    if(rowData !== undefined && rowData !== null){
                                        rowData = rowData[data];
                                    } else {
                                        rowData = null;
                                    }
                                });
                                resultData = rowData;
                            }else {
                                resultData = list[code];
                            }
                            switch (code) {
                                case 'no':
                                    return(<td key={i} name={code}>{(props.totalElementsCnt - (props.currentPage * props.rowPerPage)) - index}</td>)
                                case 'usable':
                                    return(<td key={i} name={code}>{(resultData !== undefined ? (resultData ? '사용' : '사용안함') : '')}</td>)
                                
                                case 'enabled':
                                    return(<td key={i} name={code}>{(resultData !== undefined ? (resultData ? '사용' : '사용안함') : '')}</td>)
                               
                                case 'publicYn':
                                    return(<td key={i} name={code}>{(resultData !== undefined ? (resultData ? '사용' : '사용안함') : '')}</td>)
                                
                                case 'attributes':
                                case 'operations':
                                    if(resultData.length > 0) {
                                        const tempArray = [];
                                        resultData.map(data => {
                                            tempArray.push(data.code);
                                        });
                                        return(<td key={i} name={code}>{tempArray.join()}</td>)
                                    }

                                case 'attribute1':
                                case 'attribute2':
                                case 'attribute3':
                                case 'attribute4':
                                case 'attribute5':
                                    return(<td key={i} name={code}>{(resultData !== undefined ? resultData : '')}</td>)
                                
                                case 'valueType':
                                    return(<td key={i} name={code}>{(resultData === 'ENUMERATION' ? '열거형' : (resultData === 'RANGE' ? '범위형' : ''))}</td>)

                                case 'availableValues':
                                    const addCommaResult = resultData !== undefined && resultData.map((value, index) => {
                                        if(resultData.length-1 === index) {
                                            return value;
                                        } else {
                                            return value+=', ';
                                        }
                                    });
                                    return(<td key={i} name={code}>{addCommaResult}</td>)
                                
                                case 'authCheck' :
                                case 'searchAuth' :
                                case 'saveAuth' :
                                case 'excelAuth' :
                                case 'deleteAuth' :
                                    return(
                                        <td key={i} name={code}>
                                            <CustomCheckbox
                                                id={`${code}_${index}`}
                                                className="j-c-c h-16px"
                                                title=""
                                                checked={checkedItems2.includes(`${code}_${index}`)}
                                                onChange={handleCheckbox2}
                                                disabled={!isEditMode}
                                            />
                                        </td>
                                    )
                                case 'authGroupMenu.searchAuth' :
                                case 'authGroupMenu.saveAuth' :
                                case 'authGroupMenu.excelAuth' :
                                case 'authGroupMenu.deleteAuth' :
                                    return(
                                        <td key={i} name={code}>
                                            <CustomCheckbox
                                                id={`${code}_${index}`}
                                                className="j-c-c h-16px"
                                                title=""
                                                checked={checkedItems2.includes(`${code}_${index}`)}
                                                onChange={handleCheckbox2}
                                                // disabled={!isEditMode}
                                                disabled={list[`${code}_visible`] ? !isEditMode : true}
                                            />
                                        </td>
                                    )
                                case 'authGroupMenu' :
                                    return(
                                        <td key={i} name={code}>
                                            <CustomCheckbox
                                                id={`${code}_${index}`}
                                                className="j-c-c h-16px"
                                                title=""
                                                checked={checkedItems2.includes(`${code}_${index}`)}
                                                onChange={handleCheckbox2}
                                                disabled={true}
                                            />
                                        </td>
                                    )
                                case 'authGroup' :
                                case 'authGroupName' :
                                    return(
                                        <td
                                            key={i} 
                                            name={code} 
                                            {...tdClickEvt}
                                        >
                                            {String(resultData)}
                                        </td>
                                    )
                                case 'qnaFinished' :
                                    return(
                                        <td key={i} name={code}>
                                            <CustomCheckbox
                                                id={`${code}_${index}`}
                                                className="j-c-c h-16px"
                                                title=""
                                                checked={contentData[index][code]}
                                                disabled={!isEditMode}
                                            />
                                        </td>
                                    )
                                default:
                                    if(columnData.hidden) {
                                        return(<td key={i} name={code} style={{display: 'none'}}>{String(resultData)}</td>)
                                    } else if( columnData.setInnerHtml ){
                                        return(
                                            <td 
                                                key={i} 
                                                name={code} 
                                                {...tdClickEvt}
                                            ><div dangerouslySetInnerHTML={{__html: String(resultData)}}></div></td>
                                        )
                                                
                                    } else {
                                        return(
                                            <td 
                                                key={i} 
                                                name={code} 
                                                {...tdClickEvt}
                                            >
                                                {
                                                    isEditMode ?
                                                        <input
                                                            type="text"
                                                            name={`${code}_${index}`}
                                                            className="w-100"
                                                            value={contentData[index][code] || ""}
                                                            onChange={onChangeTextHandler}
                                                        />
                                                        :
                                                        (columnData.tdClickEvent? "pop-up" : ((resultData === null || resultData === undefined) ? '-' : String(resultData)))
                                                }
                                            </td>
                                        )
                                    }
                            }
                        })
                    }
                </tr>
            )
        })) :
        (<tr className="row">
            <td colSpan={(props.checkbox || props.radio) ? (1 + columnListLen) : (columnListLen)}>조회 된 데이터가 없습니다.</td>
        </tr>)

    /*********** 불필요하다해서 제거함 ***********/ 
    // let cnt = 0;
    // const blankTr = (rowPerPage - drawElementsCnt) > 0 && [...Array(rowPerPage - drawElementsCnt)].map(() => {
    //     let tdCnt = 0;
    //     cnt++;
    //     return (
    //         <tr key={`tempRow_${cnt}`}>
    //             {
    //                 props.checkbox && 
    //                 <td style={{height: '20px'}}>
    //                     <CustomCheckbox
    //                         id={`tempRow_${cnt}`}
    //                         className="j-c-c h-16px"
    //                         title=""
    //                         checked={false}
    //                         disabled
    //                     />
    //                 </td>
    //             }
    //             {
    //                 [...Array(columnListLen)].map(() => {
    //                     tdCnt++;
    //                     return(<td key={`tempTd_${cnt}_${tdCnt}`} style={{height: '20px'}}></td>)
    //                 })
    //             }
    //         </tr>
    //     )
    // });
    /*********** 불필요하다해서 제거함 ***********/ 

    return (
        <Fragment>
            <div className={props.className ? props.className : "w-100 h-60vh overflowYscroll"}>
                <table className="mainTable">
                    <colgroup>
                        { (props.checkbox || props.radio) && <col width="2%"/> }
                        {colgroup}
                    </colgroup>
                    <thead className="bgC-c5c5c5">
                        <tr>
                            { (props.checkbox || props.radio) && <th className="tableHead fixedHeader t-0px"></th> }
                            { props.columnList.map(list => {
                                if(!list.hidden) {
                                    return (
                                        <th key={list.title} className="v-middle tableHead fixedHeader t-0px">
                                            {props.sort ? 
                                                <button 
                                                    className={classNames('sortBtn', 
                                                        // {
                                                        //     'ascending' : sortOrder,
                                                        //     'descending' : !sortOrder
                                                        // }
                                                    )}
                                                >
                                                    {list.title}
                                                </button> :
                                                <span className="h-24px">{list.title}</span>
                                            }
                                        </th>
                                    )
                                }
                            })}
                        </tr>
                    </thead>
                    <tbody className="tableBody">
                        { contents }
                        {/* { contentData !== undefined && contentData.length > 0 && blankTr } */}
                    </tbody>
                </table>
            </div>
            {
                props.paging && 
                <div className="pagination-wrappper">
                    {
                        contentData !== undefined && contentData.length > 0 &&
                        <CustomPagination
                            activePage={props.currentPage}
                            itemsCountPerPage={props.rowPerPage}
                            totalItemsCount={props.totalElementsCnt}
                            pageRange={5}
                            onChange={handleOnChgPage}
                        />
                    }
                </div>
            }
        </Fragment>
    )
}
