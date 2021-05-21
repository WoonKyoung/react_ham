import React, { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

export const TinymceEditor = (props) => {
    const {height, value, disabled} = props;

    const [content, setContent] = useState(props.content);

    const handleEditorChange = (e) => {
        props.liftValue(e.target.getContent());
    }
    
    return (
        <Editor 
            apiKey="b4pzl0ukm8ams4m1jopdmovv19d7jsbuaf0wmi54a3ps22ul"
            init={{
            height: height,
            menubar: false,
            plugins: [
                'advlist autolink lists link image', 
                'charmap print preview anchor help',
                'searchreplace visualblocks code',
                'insertdatetime media table paste wordcount'
            ],
            toolbar: 'formatselect | bold italic underline link | bullist numlist',
            content_style: 'body { font-family: NotoSansCJKkr; font-size: 12px; font-weight: normal; font-stretch: normal; font-style: normal; line-height: normal; letter-spacing: normal; color: #444444;'
            }}
            value={value}
            onChange={handleEditorChange}
            disabled={disabled}
        />
        
    )
}
