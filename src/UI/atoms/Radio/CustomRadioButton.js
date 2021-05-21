import React from 'react'
import classNames from 'classnames';
import './CustomRadioButton.scss';

export const CustomRadioButton = (props) => {

    const { className, title, id, name, value, checked, disabled } = props;

    return (
        <div className={classNames('radioBtn', className)}>
            <input 
                type="radio"
                id={id}
                name={name}
                value={value}
                checked={checked}
                onChange={e => props.customOnChange(name, e.target.value)}
                disabled={disabled}
            />
            <label htmlFor={id}>
                {title}&zwnj;
            </label>
        </div>
    )
}
