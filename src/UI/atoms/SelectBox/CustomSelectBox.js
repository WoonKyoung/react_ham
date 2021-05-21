import React, { useState, useEffect, Fragment } from 'react'
import classNames from 'classnames';

const CustomSelectBox = (props) => {

    const [categoryList, setCategoryList] = useState(props.categoryList || []);

    useEffect(() => {
        setCategoryList(props.categoryList);
    }, [props.categoryList])

    const onChangeHandler = (e) => {
        if(props.callbackCodeName){
            props.onChangeHandler(e.target.value,  e.target.options[e.target.options.selectedIndex].text );
        } else {
            props.onChangeHandler(e.target.value);
        }
        
    }

    const categories = categoryList.map((data, index) => {
        return (<option key={index} value={data.code}>{data.name}</option>)
    });

    return (
        <Fragment>
            <select 
                className={classNames('searchCategory', props.className)}
                name={props.name}
                value={props.value}
                onChange={(e) => onChangeHandler(e)}
                disabled={props.disabled}
            >
                {categories}
            </select>
        </Fragment>
    )
}

export default CustomSelectBox;