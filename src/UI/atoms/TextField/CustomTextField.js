import React, { Fragment } from 'react'
import classNames from 'classnames';
import './CustomTextField.scss';

export const CustomTextField = (props) => {

    const { type, className, title, name, required, disabled, readOnly, validLen, validRegExp, placeholder, value, customOnChange, customOnClick, customOnKeyPress } = props;

    const onClickHandler = (e) => {
        props.customOnClick(name);
    }

    const onChangeHandler = (e) => {
        if(validRegExp !== undefined) {
            if(validRegExp.test(e.target.value)) {
                e.target.value = e.target.value.replace(validRegExp, '')
            }
            props.customOnChange(name, e.target.value);
        } else {
            props.customOnChange(name, e.target.value);
        }
    }
    
    const onKeyPressHandler = (e) => {
        customOnKeyPress(e);
    }

    // 최대 글자 수 제한
    const maxLen = validLen ? {maxLength: validLen} : {};

    // readOnly 속성 부여
    const readOnlyVal = readOnly ? {readOnly: true} : {};

    // ClickEvent or ChangeEvent 적용(둘중 하나만 써야함.)
    const onClickEvt = customOnClick ? {onClick: onClickHandler} : {};
    const onChangeEvt = customOnChange ? {onChange: onChangeHandler} : {};
    const onKeyPressEvt = customOnKeyPress ? {onKeyPress: onKeyPressHandler} : {};

    let resultData;
    if(typeof(name) === 'string' && name.includes('.')) {
        let rowData = value;
        const nameArray = name.split('.');
        nameArray.map((data, index) => {
            rowData = rowData[data] ? rowData[data] : '';
        });
        resultData = rowData;
    }else {
        resultData = value[name] ? value[name] : '';
    }

    return (
        <Fragment>
            {title !== undefined && 
            <label className="label_title">{title} {required && '*'}</label>}
            <input 
                className={classNames('textField', className, {'textField_disabled' : disabled})}
                type={type ? type : "text" }
                name={name}
                placeholder={placeholder}
                disabled={disabled}
                {...onClickEvt}
                {...onChangeEvt}
                {...onKeyPressEvt}
                {...maxLen}
                {...readOnlyVal}
                value={resultData}
            />
        </Fragment>
    )
}
