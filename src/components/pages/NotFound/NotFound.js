import React from "react";
import "./NotFound.scss";
import {useHistory} from "react-router-dom";

export const NotFound = () => {
    const history = useHistory();
    const handleOnClickButton= ()=>{
        history.replace("/");
    }
    return (
        <div className="center">
            <span className="title" > 404 not found</span>
            <p className="paragraph-left">
                해당 페이지는 현재 삭제 되었거나 일시적으로 접속이 불가능 합니다.
            </p>
            <button className="button-left" onClick={handleOnClickButton}> 홈페이지로 돌아가기 </button>
        </div>
    )
};
