import React, { memo, useEffect } from "react";

function NomalComponent ({ name }){
    useEffect(()=> {
       console.log("하위 컴포넌트 렌더링");
    });
    return <div> { name }</div>

}

export default NomalComponent;