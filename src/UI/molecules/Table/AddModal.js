import {useHistory} from "react-router-dom";
import { useEffect, useState} from "react";
import store from 'stores/store';
import Net from 'actions/net';

export const AddModal = (props) => {
    const history = useHistory();

    const userInfo = JSON.parse(sessionStorage.getItem('user'));

    const [oriTextValue, setOriTextValue] = useState("");
    const [textEditorVal, setTextEditorVal] = useState("");
    const [form, setForm] = useState({
        questionId: props.form.questionId ? props.form.questionId : '',
        answerId: props.form.answerId ? props.form.answerId : '',
        contents: '',
        finished: false,
        userInfo: userInfo
    });
    const [registPage, setRegistPage] = useState(true);

    useEffect(() => {
        if (form.answerId) {
            Net.getQnaAnswerOne(form, (response) => {
                if (response.status === 200) {
                    setForm({
                        ...form,
                        ...response.data,
                    });
                    setOriTextValue(response.data.contents);
                    // 등록페이지 여부 확인
                    setRegistPage(false);
                }
            });
        }
    }, [])

    const radioBtnHandler = (name, value) => {
        const nextForm = {
            ...form,
            [name]: value === 'true' ? true : false,
        }
        setForm(nextForm);
    }

    const onRemoveHandler = () => {
        const result = window.confirm('삭제하시겠습니까?');
        if (result) {
            Net.removeQnaAnswer([{questionId: form.questionId, answerId: form.answerId}], (response) => {
                if (response) {
                    handleClose();
                }
            });
        }
    }

    const onSubmitHandler = () => {
        if (!form.contents) {
            alert("처리 내용을 입력해주세요.");
            return false;
        }
        var result = window.confirm('저장하시겠습니까?');
        if (result) {
            if (registPage) {
                Net.addQnaAnswer(form, (response) => {
                    if (response.status === 200 || response.status === 201) {
                        handleClose();
                    }
                });

            } else {
                Net.updateQnaAnswer(form, (response) => {
                    if (response.status === 200) {
                        handleClose();
                    }
                });
            }
        }
    }

    const liftValue = (value) => {
        setTextEditorVal(value);
        setForm({
            ...form,
            contents: value,
        });
    }

    const handleClose = () => {
        props.modalClose(false);
    };

    return (
        <div className="h-100">
            <div className="h-90" style={{display: "table"}}>

                <div className="flex w-100 mb-12">
                    <label className="label_title">처리여부*</label>
                    <CustomRadioButton
                        className="mr-60"
                        title="완료"
                        id="radioBtn1"
                        name="finished"
                        value={true}
                        checked={form.finished}
                        customOnChange={radioBtnHandler}
                    />
                    <CustomRadioButton
                        title="진행"
                        id="radioBtn2"
                        name="finished"
                        value={false}
                        checked={!form.finished}
                        customOnChange={radioBtnHandler}
                    />
                </div>
                <div className="flex mb-12 w-100">
                    <label className="label_title">내용 *</label>
                    <TinymceEditor
                        liftValue={liftValue}
                        value={oriTextValue}
                    />
                </div>
            </div>
            <div className="footer_btn h-10 m-20">
                <div className="">
                    <button className="w-80px h-30px addBtn mr-10" onClick={onSubmitHandler}>저장</button>
                    {registPage ? "" :
                        <button className="w-80px h-30px removeBtn mr-10" onClick={onRemoveHandler}>삭제</button>}
                    <button className="w-80px h-30px cancelBtn" onClick={handleClose}>취소</button>
                </div>
            </div>
        </div>
    )
};

