import React from 'react';
import styled from 'styled-components';

const StyledDiv = styled.div`
    margin-bottom: 15px;
    align-items : center;
`;

const StyledLabel = styled.label`
    font-weight: bold;
  margin : 5px;
`;

function Field(props) {
    return (
        <StyledDiv>
          <StyledLabel htmlFor={props.id}>{props.labelText}: </StyledLabel>
          {props.children}
        </StyledDiv>
    )
}

export default Field;