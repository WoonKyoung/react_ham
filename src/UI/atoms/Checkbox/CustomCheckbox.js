import React, { useState, useEffect } from 'react'
import classNames from "classnames";
import './CustomCheckbox.scss';

export const CustomCheckbox = (props) => {

    const [checked, setChecked] = useState(props.checked ? true : false);

    useEffect(() => {
        setChecked(props.checked);
    }, [props.checked])

    const handleChange = () => {
        setChecked(!checked);
        props.onChange(props.id, !checked);
    }

    return (
        <div className={classNames('customCheckbox',
                props.className
        )}>
            {
                props.readOnly ?
                <input
                    type="checkbox"
                    id={props.id}
                    checked={false}
                    readOnly
                /> :
                <input
                    type="checkbox"
                    id={props.id}
                    // defaultChecked={checked}
                    checked={checked}
                    onChange={handleChange}
                    disabled={props.disabled}
                />
            }
            
            <label 
                htmlFor={props.id}
                className={classNames({
                        'w-16px' : !props.title,
                        'bgC-efefef' : props.disabled,
                    }
                )}
            >
                {props.title && <p>{props.title}</p>}
            </label>
        </div>
    )
}