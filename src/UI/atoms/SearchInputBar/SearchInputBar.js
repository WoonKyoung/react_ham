import React, { Fragment, useState, useEffect } from 'react';
import classNames from 'classnames';
import CustomSelectBox from '../SelectBox/CustomSelectBox';
import DatePicker from "react-datepicker";
import './SearchInputBar.scss';

const threeDaysAgo = () => {
    const d = new Date();
    const dayOfMonth = d.getDate();
    d.setDate(dayOfMonth - 3);
    return d;
}

export const SearchInputBar = (props) => {

    const [state, setState] = useState({
        searchCategoryGroup: props.searchCategoryGroup || [],
        selectedCategory: (props.searchCategory && props.searchCategoryGroup[0][0].code) || ["", ""],
        searchText: '',
        searchText2: '',
        searchStartDate: '',
        searchEndDate: '',
    });

    const [startDate, setStartDate] = useState(threeDaysAgo());
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        setState({
            ...state,
            searchCategoryGroup: props.searchCategoryGroup
        })
    }, [ props.searchCategoryGroup ])

    useEffect(() => {
        props.dynamicSearch && onSubmit('selectbox');
    }, [ state.selectedCategory ])
     
    useEffect(() => {
        dateChangeHandler();
        if(props.searchDate) {
            props.searchDate(startDate, endDate);
        }
    }, [ startDate, endDate ])

    const onChangeHandler = (index, value) => {
        
        let newArr = [];

        if(props.relateCategoryHandler){
            if(index === 0){
                props.relateCategoryHandler(value?value:"reset");
                newArr = [...state.selectedCategory];
                newArr[0] = value;
                newArr[1] = "";
            } else {
                newArr = [...state.selectedCategory];
                newArr[index] = value;
            }
        } else {
            newArr = [...state.selectedCategory];
            newArr[index] = value;
        }
       
        setState({
            ...state,
            selectedCategory: newArr,
        })
    }

    const onSubmit = (type) => {
        if(props.searchDate){
            if(!startDate && !endDate){

            } else if(!startDate) {
                alert("검색 시작일자를 입력해주세요.");
                return false;
            } else if(!endDate) {
                alert("검색 종료일자를 입력해주세요.");
                return false;
            }
        }
        
        if(type) {
            state.type = type;
        }
        props.onSubmit(state);
    }

    const keyPressHandler = (e, type) => {
        if(e.key === 'Enter') {
            onSubmit(type);
        }
    }

    const dateChangeHandler = () => {
        if(startDate && endDate){
            const startDateFormating = startDate.getFullYear() + '-' + ('0' + (Number(startDate.getMonth())+1)).slice(-2) + '-' + ('0' + startDate.getDate()).slice(-2);
            const endDateFormating = endDate.getFullYear() + '-' + ('0' + (Number(endDate.getMonth())+1)).slice(-2) + '-' + ('0' + endDate.getDate()).slice(-2);
            setState({
                ...state,
                searchStartDate: startDateFormating,
                searchEndDate: endDateFormating
            });
        } else {
            setState({
                ...state,
                searchStartDate: '',
                searchEndDate: ''
            });
        }
    }

    return (
        <div className={classNames('searchInput-wrapper', props.className)}>
            {
                props.dynamicSearch ? 
                (
                    <Fragment>
                        {props.searchCategory &&
                            state.searchCategoryGroup.map((data, index) => {
                            return (
                                <CustomSelectBox
                                    key={index}
                                    className={index>0 ? 'ml-10' : ''}
                                    categoryList={data}
                                    value={state.selectedCategory[index]}
                                    onChangeHandler={(value) => onChangeHandler(index, value)}
                                />
                            )
                        })}

                        {props.searchText &&
                        <input 
                            className={classNames('searchText', 
                                {
                                    'ml-10' : props.searchCategory, 
                                    'mr-10' : props.searchBtn
                                }
                            )}
                            type="text"
                            value={state.searchText}
                            placeholder={props.searchPlaceHolder}
                            onChange={(e)=>setState({
                                ...state,
                                searchText: e.target.value
                            })}
                            onKeyPress={(e) => keyPressHandler(e, 'button')}
                        />}
                        {props.searchText2 &&
                        <input 
                            className={classNames('searchText', 
                                {
                                    'mr-10' : props.searchBtn
                                }
                            )}
                            type="text"
                            value={state.searchText2}
                            placeholder={props.searchPlaceHolder2}
                            onChange={(e)=>setState({
                                ...state,
                                searchText2: e.target.value
                            })}
                            onKeyPress={(e) => keyPressHandler(e, 'button')}
                        />}

                        {props.searchDate &&
                        <span className="searchDate">
                            <label>검색기간</label>
                            <span>
                                <DatePicker 
                                    dateFormat="yyyy-MM-dd"
                                    selected={startDate} 
                                    onChange={date => {
                                        setStartDate(date);
                                    }}
                                    className="w-100 textField"
                                />
                            </span>
                            <span className="ml-8 mr-8 m-auto"> ~ </span>
                            <span className="mr-10">
                                <DatePicker 
                                    dateFormat="yyyy-MM-dd"
                                    selected={endDate} 
                                    onChange={date => {
                                        setEndDate(date);
                                    }}
                                    className="w-100 textField"
                                /> 
                            </span>
                        </span>}

                        {props.searchBtn &&
                        <button 
                            className={classNames('searchBtn',
                                {
                                    'ml-10' : !props.searchText
                                }
                            )}
                            onClick={() => onSubmit('button')}
                        >
                            {props.searchBtnTitle}
                        </button>}
                    </Fragment>
                ) :
                (
                    <Fragment>
                        {props.searchCategory &&
                            state.searchCategoryGroup.map((data, index) => {
                            return (
                                <CustomSelectBox
                                    key={index}
                                    className={index>0 ? 'ml-10' : ''}
                                    categoryList={data}
                                    value={state.selectedCategory[index]}
                                    onChangeHandler={(value) => onChangeHandler(index, value)}
                                />
                            )
                        })}


                        {props.searchText &&
                        <input 
                            className={classNames('searchText', 
                                {
                                    'ml-10' : props.searchCategory, 
                                    'mr-10' : props.searchBtn
                                }
                            )}
                            type="text"
                            value={state.searchText}
                            placeholder={props.searchPlaceHolder}
                            onChange={(e)=>setState({
                                ...state,
                                searchText: e.target.value
                            })}
                            onKeyPress={keyPressHandler}
                        />}
                    </Fragment>
                )
            }
            { !props.dynamicSearch && props.searchDate &&
                <span className="searchDate ml-10">
                    <label>검색기간</label>
                    <span>
                        <DatePicker 
                            dateFormat="yyyy-MM-dd"
                            selected={startDate} 
                            onChange={date => {
                                setStartDate(date);
                            }}
                            className="w-100 textField"
                        />
                    </span>
                    <span className="ml-8 mr-8 m-auto"> ~ </span>
                    <span className="mr-10">
                        <DatePicker 
                            dateFormat="yyyy-MM-dd"
                            selected={endDate} 
                            onChange={date => {
                                setEndDate(date);
                            }}
                            className="w-100 textField"
                        /> 
                    </span>
                </span>
            }
            { !props.dynamicSearch && props.searchBtn &&
                <span style={{display: "inline-flex"}}>
                    <button 
                        className={classNames('searchBtn',
                            {
                                'ml-10' : !props.searchText
                            }
                        )}
                        onClick={() => onSubmit('button')}
                    >
                        {props.searchBtnTitle}
                    </button>
                </span>
            }
            
        </div>
    )
}
