import React, { useEffect, useState } from 'react';
import { useHistory, withRouter } from 'react-router-dom';
import { CustomTextField, CustomRadioButton, CustomSelectBox, ImgUpload, TinymceEditor } from '../../../../UI/atoms';
import store from '../../../../stores/store';
import DatePicker from "react-datepicker";
import Net from '../../../../actions/net';

const NoticeRegist = ({match}) => {

    const [form, setForm] = useState({
        noticeId: '',
        classification: '',
        mainNotice: false,
        title: '',
        contents: '',
        customer: {
            code:'',
            name:'',
        },
        site: {
            code:'',
            name:'',
        },
        dong: '',
        ho: '',
        startDate: '',
        endDate: '',
        publicYn: true,
        image: '',
        imageDataUrl: '',
    });

    const [registPage, setRegistPage] = useState(true);
    const [duplicateChk, setDuplicateChk] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [oriTextValue, setOriTextValue] = useState("");
    const [customerList, setCustomerList] = useState([{
        code: '',
        name: '고객사명 선택'
    }]);
    const [siteList, setSiteList] = useState([{
        code: '',
        name: '현장명 선택'
    }]);
    const [classificationList, setClassificationList] = useState([
        [
            {code: '', name: '구분 선택'}
        ]
    ]);
    const [modalState, setModalState] = useState({
        open: false,
        data: [],
        clickedBtnName: ''
    });
    const [image, setImage] = useState("");
    const [textEditorVal, setTextEditorVal] = useState("");

    useEffect(() => {
        store.openedPage = '공지사항 등록/수정';

        // 상세 조회(수정 목적으로 진입시)
        if(match.params.noticeId !== undefined) {
            getNoticeOne(match.params, (response) => {
                if(response.status === 200) {
                    if(!response.data.customer){
                        response.data.customer = {code: "", name: ""};
                    }
                    if(!response.data.site){
                        response.data.site = {code: "", name: ""};
                    }
                    if(response.data.dong === "ALL"){
                        response.data.dong = "";
                    }
                    if(response.data.ho === "ALL"){
                        response.data.ho = "";
                    }  
                    setForm({
                        ...form,
                        ...response.data,
                    });
                    setOriTextValue(response.data.contents);

                    // 등록페이지 여부 확인
                    setRegistPage(false);
                    
                    setStartDate(new Date(response.data.startDate));
                    setEndDate(new Date(response.data.endDate));
                    
                }
            });
        }

        // 고객사 전체 목록
        getCustomerList((response) => {
            setCustomerList(response);
        });
        getClassificationList();
    }, []);

    useEffect(() => {
        dateChangeHandler();    
    }, [ startDate, endDate ])

    useEffect(() => {
        if(form.customer.code !== '') {
            getSiteList(form.customer.code, (response) => {
                setSiteList(response);
            })
        } else {
            // 빈값 선택시 장비모델명 selectbox 초기화
            setSiteList([
                {
                    code: '',
                    name: '현장명 선택'
                }
            ])
        }
    }, [form.customer.code]);

    const getCustomerList = (callback) => {
        Net.getCustomerList(
            {currentPage: '', rowPerPage: '', searchText: ''}, (response) => {
            if(response.status === 200) {
                let newArray = customerList;
                response.data.content.map(items => {
                    newArray = [
                        ...newArray,
                        {
                            code: items.code,
                            name: items.name
                        }
                    ]
                });
                callback(newArray);
            } 
        });
    }
                 
    const getSiteList = (code, callback) => {
        Net.getSitesList(
            {
                currentPage: '', 
                rowPerPage: '', 
                searchText: '',
                customerCode: code,
            }, (response) => {
            if(response.status === 200) {
                let newArray = [
                    {
                        code: '',
                        name: '현장명 선택'
                    }
                ];
                response.data.content.map(items => {
                    newArray = [
                        ...newArray,
                        {
                            code: items.code,
                            name: items.name
                        }
                    ]
                });
                callback(newArray);
            } else if(response.status === 204) {
                let newArray = [
                    {
                        code: '',
                        name: '현장명 선택'
                    }
                ];
                callback(newArray);
            }
        });
    }

    const getClassificationList = () => {
        Net.getCommunityCode(
            "NOTICE_CLASSIFICATION", (response) => {
                if(response.status === 200) {
                    let newArray = classificationList[0];

                    response.data.map(items => {
                        if( items.usable ){
                            newArray = [
                                ...newArray,
                                {
                                    code: items.code,
                                    name: items.name
                                }
                            ]
                        }                        
                    })
                    setClassificationList(newArray);
                }
            }
        )
        
    }

    const history = useHistory();

    const getNoticeOne = (params, callback) => {
        Net.getNoticeOne(params.noticeId, (response) => {
            callback(response);
        });
    }

    const textFieldHandler = (name, value) => {
        if(name === 'code') setDuplicateChk(false);
        const nextForm = {
            ...form,
            [name]: value
        }
        setForm(nextForm);
    }

    const radioBtnHandler = (name, value) => {
        let nextForm;
        if(name === "authGroup"){
            nextForm = {
                ...form,
                [name]: value,
            }
        } else {
            nextForm = {
                ...form,
                [name]: value === 'true' ? true : false,
            }
        }
        
        setForm(nextForm);
    }

    const selectBoxHandler = (name, value) => {
        switch (name) {
            case 'customer.code':
                setForm({
                    ...form,
                    customer: {
                        code: value.code,
                        name: value.name
                    },
                    site: {
                        code: "",
                        name: ""
                    }
                });
                break;
            case 'site.code':
                setForm({
                    ...form,
                    site: {
                        code: value.code,
                        name: value.name
                    }
                });
                break;
            case 'classification':
                setForm({
                    ...form,
                    classification: value
                });
                break;
            default:
                break;
        }
    }

    const onSubmitHandler = () => {

        if( !form.classification ) {
            alert('구분을 선택해 주세요.');
            document.getElementsByName('classification')[0].focus();
            return false;
        }
        if( !form.title ) {
            alert('제목을 입력해 주세요.');
            document.getElementsByName('title')[0].focus();
            return false;
        }
        if( !form.contents ) {
            alert('내용을 입력해 주세요.');
            return false;
        }
        if( !form.customer.code ) {
            alert('고객사를 선택해 주세요.');
            document.getElementsByName('customer.code')[0].focus();
            return false;
        }
        if(form.classification !== 'INCIDENT' && !form.site.code ) {
            alert('현장명을 선택해 주세요.');
            document.getElementsByName('site.code')[0].focus();
            return false;
        }

        var result = window.confirm('저장하시겠습니까?');
        if(result) {
            if(registPage) {
                Net.addNotice(form, (response) => {
                    console.log(response.status)
                    if(response.status === 200 || response.status === 201) {
                        history.push('/community/notice/list');
                    }
                });
            } else {
                Net.updateNotice(form, (response) => {
                    if(response.status === 200) {
                        history.push('/community/notice/list');
                    }
                });
            }
        }
    }

    const onCancelHandler = () => {
        history.push('/community/notice/list');
    }

    const sendData = (e) => {
        setModalState({
            ...modalState,
            data: e,
        })
    }
    
    const getImgFile = (dataUrl) => {
        setForm({
            ...form,
            imageDataUrl: dataUrl,
        });
    }

    const liftValue = (value) => {
        setTextEditorVal(value);
        setForm({
            ...form,
            contents: value,
        });
    }

    const dateChangeHandler = () => {

        const startDateFormating = startDate.getFullYear() + '-' + ('0' + (Number(startDate.getMonth())+1)).slice(-2) + '-' + ('0' + startDate.getDate()).slice(-2);
        const endDateFormating = endDate.getFullYear() + '-' + ('0' + (Number(endDate.getMonth())+1)).slice(-2) + '-' + ('0' + endDate.getDate()).slice(-2);
        setForm({
            ...form,
            startDate: startDateFormating,
            endDate: endDateFormating
        });
    }

    const onRemoveHandler = () => {
        const result = window.confirm('삭제하시겠습니까?');
        if(result) {
            Net.removeNotice([{noticeId: form.noticeId}], (response) => {
                if(response) {
                    history.push('/community/notice/list');
                }
            });
        }
    }

    return (
        <div className="w-100 h-100">
            <div className="w-100 h-7 display_table"></div>
            <div className="w-100 h-1px bgC-efefef" />
            <div className="h-93">
                <div className="flex h-90">
                    <div className="w-60 h-100">
                        <div className="ml-55 mt-12">
                            <div className="flex mb-12 w-90">
                                <label className="label_title">구분 (*)</label>
                                <CustomSelectBox
                                    name="classification"
                                    categoryList={classificationList}
                                    value={form.classification}
                                    onChangeHandler={(value) => selectBoxHandler('classification', value)}
                                    callbackCodeName="N"
                                />
                            </div>
                            <div className="flex w-90 mb-8">
                                <label className="label_title">중요 공지 *</label>
                                <CustomRadioButton
                                    className="mr-60"
                                    title="중요"
                                    id="mainNoticeY"
                                    name="mainNotice"
                                    value={true}
                                    checked={form.mainNotice}
                                    customOnChange={radioBtnHandler}
                                />
                                <CustomRadioButton 
                                    title="일반"
                                    id="mainNoticeN"
                                    name="mainNotice"
                                    value={false}
                                    checked={!form.mainNotice}
                                    customOnChange={radioBtnHandler}
                                />
                            </div>
                            <div className="flex mb-12 w-90">
                                <CustomTextField 
                                    className="w-65 h-26px"
                                    title="제목"
                                    name="title"
                                    required={true}
                                    disabled={false}
                                    placeholder=""
                                    customOnChange={textFieldHandler}
                                    value={form}
                                />
                            </div>
                            <div className="flex mb-12 w-90">
                                <label className="label_title">내용 *</label>
                                <TinymceEditor
                                    liftValue={liftValue}
                                    value={oriTextValue}
                                />
                            </div>
                            <div className="flex mb-12 w-90">
                                <label className="label_title">고객사 *</label>
                                <CustomSelectBox
                                    name="customer.code"
                                    categoryList={customerList}
                                    value={form.customer.code}
                                    onChangeHandler={(value, name) => selectBoxHandler('customer.code', {code: value, name: name})}
                                    callbackCodeName="Y"
                                />
                            </div>
                            <div className="flex mb-12 w-90">
                                <label className="label_title">현장 *</label>
                                <CustomSelectBox
                                    name="site.code"
                                    categoryList={siteList}
                                    value={form.site.code}
                                    onChangeHandler={(value, name) => selectBoxHandler('site.code', {code: value, name: name})}
                                    callbackCodeName="Y"
                                />
                                <div className="label_summary ml-10">※ 구분이 `장애`이면 현장은 필수가 아님</div>
                            </div>
                            <div className="flex mb-12 w-90">
                                <div className="flex w-50 h-26px">
                                    <CustomTextField 
                                        className="w-40"
                                        title="장소(동)"
                                        name="dong"
                                        required={false}
                                        disabled={false}
                                        validLen="15"
                                        //validRegExp={/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi}
                                        placeholder=""
                                        customOnChange={textFieldHandler}
                                        value={form}
                                    />
                                </div>
                                <div className="flex w-50 h-26px">
                                    <CustomTextField 
                                        className="w-40"
                                        title="장소(호)"
                                        name="ho"
                                        required={false}
                                        disabled={false}
                                        validLen="15"
                                        //validRegExp={/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi}
                                        placeholder=""
                                        customOnChange={textFieldHandler}
                                        value={form}
                                    />
                                </div>
                                
                            </div>
                            <div className="flex mb-12 w-90">
                                <label className="label_title">공개기간 *</label>
                                <div className="w-20 mr-10">
                                    <DatePicker 
                                        dateFormat="yyyy-MM-dd"
                                        selected={startDate} 
                                        onChange={date => {
                                            setStartDate(date);
                                        }}
                                        className="w-100 textField"
                                    /> 
                                </div>
                                ~
                                <div className="w-20 ml-10">
                                    <DatePicker 
                                        dateFormat="yyyy-MM-dd"
                                        selected={endDate} 
                                        onChange={date => {
                                            setEndDate(date);
                                        }}
                                        className="w-100 textField"
                                    /> 
                                </div>                             
                            </div>
                            <div className="flex w-90">
                                <label className="label_title">사용유무</label>
                                <CustomRadioButton
                                    className="mr-60"
                                    title="사용"
                                    id="radioBtn1"
                                    name="publicYn"
                                    value={true}
                                    checked={form.publicYn}
                                    customOnChange={radioBtnHandler}
                                />
                                <CustomRadioButton 
                                    title="사용안함"
                                    id="radioBtn2"
                                    name="publicYn"
                                    value={false}
                                    checked={!form.publicYn}
                                    customOnChange={radioBtnHandler}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="w-40 h-100">
                        <div className="w-100 h-100 mt-12" style={{display:"block"}} >
                            <div className="floatC mr-2p" >
                                <ImgUpload 
                                    title={"사진"}
                                    imgUpload={getImgFile}
                                    imgSize={"300px"}
                                    imgFile={form.imageDataUrl}
                                />
                            </div>
                            
                        </div>                      
                    </div>
                </div>
                <div className="footer_btn h-10">
                    <div className="">
                        <button className="w-160px h-30px addBtn mr-10" onClick={onSubmitHandler}>저장</button>
                        { registPage ? "" : <button className="w-160px h-30px removeBtn mr-10" onClick={onRemoveHandler}>삭제</button>}
                        <button className="w-160px h-30px cancelBtn" onClick={onCancelHandler}>취소</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withRouter(NoticeRegist);
