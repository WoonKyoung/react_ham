import { LocalConvenienceStoreOutlined } from '@material-ui/icons';
import React, {useState, useEffect} from 'react'
import './ImgUpload.scss';

export const ImgUpload = (props) => {
    const {title, inputName, disabled} = props;
    const [imgFileName, setImgFileName] = useState("");
    const [prevImgUrl, setPrevImgUrl] = useState("");

    useEffect(() => {
        setPrevImgUrl(props.imgFile);
    }, [props.imgFile])

    const onChangeImg = (e) => {
        e.preventDefault();

        let reader = new FileReader();
        let file = e.target.files[0];
        if(file.size > 512000) {
            alert('Image 사이즈가 500KB를 넘습니다.');
            return;
        }
        reader.onloadend = () => {
            props.imgUpload(reader.result);
            setImgFileName(file.name);
            setPrevImgUrl(reader.result);
        }
        reader.readAsDataURL(file);
    }

    return (
        <div className="imgUploadWrapper">
            <div className="flex fileArea">
                <span className="imgUploadTitle">{title}</span>
                <input className="upload-name" value={imgFileName} disabled="disabled"/>
                <label htmlFor={inputName ? inputName : "ex_filename"}>찾아보기</label>
                <input 
                    type="file" 
                    id={inputName ? inputName : "ex_filename"}
                    className="upload-hidden" 
                    onChange={onChangeImg} 
                    accept=".jpg,.jpeg,.png"
                    disabled={disabled}
                />
            </div>
            <div className="flex j-c-c mt-7">
                <span className="imgUploadNotice">※지원하는 파일 형식: JPG, PNG / 용량: 500KB 이내</span>
            </div>
            <div className="flex prevImgArea">
                <img 
                    className="imgFile"
                    src={prevImgUrl === undefined || prevImgUrl === "" || prevImgUrl === "data:image/jpeg;base64," ? "/noImage.jpg" : prevImgUrl}
                    alt="complex Img"
                    width={props.imgSize?props.imgSize:""}
                />
            </div>
        </div>
    )
}
