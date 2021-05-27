import React, {useEffect} from 'react';
import {Avatar, Card, CardContent, CardHeader, CardMedia, IconButton, Typography} from "@material-ui/core";
import {Skeleton} from "@material-ui/lab";
import EditIcon from "@material-ui/icons/Edit";
import "./Feed.scss";
import {AccountBox} from "@material-ui/icons";

const Feed = (props) => {

    useEffect(()=>{
        console.log(props);
    },[props])
    return(
        <>
            <Card className="card">
                <CardHeader
                    avatar={
                        (!props.detailContent.noticeId) ? (
                            <Skeleton animation = "wave" variant="circle" width={40} height={40} />
                        ) : (
                            // <Avatar
                            //     alt="사용자 그림"
                            //     src="/icon/.png"
                            //     />
                            <IconButton aria-label="Account" size="small">
                                <AccountBox />
                            </IconButton>
                        )
                    }
                    action={
                        !props.detailContent.noticeId ? null : (
                            <IconButton aria-label="edit">
                                <EditIcon />
                            </IconButton>
                        )
                    }
                    title={
                        !props.detailContent.noticeId ? (
                            <Skeleton animation="wave" height={10} width="80%" style={{ marginBottom: 6 }} />
                        ) : (
                            <>
                                {props.detailContent.title}
                            </>
                        )
                    }
                    subheader={!props.detailContent.noticeId ? <Skeleton animation="wave" height={10} width="40%" /> :
                           <>
                            {props.detailContent.site.name}
                           </>
                    }
                />

                {!props.detailContent.noticeId ? (
                    <Skeleton animation="wave" variant="rect" className="media" />
                ) : (
                    <CardMedia
                        className="media"
                        image={props.detailContent.imageDataUrl}
                        title="Ted talk"
                    />
                )}

                <CardContent>
                    {!props.detailContent.noticeId ? (
                        <React.Fragment>
                            <Skeleton animation="wave" height={10} style={{ marginBottom: 6 }} />
                            <Skeleton animation="wave" height={10} width="80%" />
                        </React.Fragment>
                    ) : (
                        <Typography variant="body2" color="textSecondary" component="p">
                            <div dangerouslySetInnerHTML={{__html: props.detailContent.contents}} />
                        </Typography>
                    )}
                </CardContent>

            </Card>
        </>
    )
}

export default Feed;