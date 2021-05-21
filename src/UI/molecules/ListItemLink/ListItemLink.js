import React, { forwardRef, useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import classNames from "classnames";
import { observer } from "mobx-react";


export const ListItemLink = observer((props) => {
    const {icon, children} = props;
    const [open, setOpen] = useState(false);
    const handleOpen = () => {
        if(props.program && props.program.path) {
            sessionStorage.setItem('menuId', props.menuId);
        }
        setOpen(!open);
    };

    const RenderLink = useMemo(() => forwardRef((itemProps, ref) => {
            let renderLi;
            if(props.program && props.program.path) {
                renderLi = <Link to={props.program.path} {...itemProps} />;
            } else {
                renderLi = <div {...itemProps} />;
            }
            return renderLi;
        })
    );

    return (
        <>
            {
                props.level === 0 &&
                (
                    <RenderLink className="menu_list4big" onClick={handleOpen}>
                        {icon ?
                            (<img
                                className="w-24px h-24px ml-20 mt-auto mb-auto"
                                src={`/icon/${icon}.png`}
                                alt={icon}
                            />) : null
                        }

                        <p>{props.menuName}</p>

                        {children && (
                            <img
                                className="w-24px h-24px mt-auto mb-auto ml-auto mr-17"
                                src={open ? '/icon/arrow-up-white.png' : '/icon/arrow-down-white.png'}
                            />
                        )}
                    </RenderLink>
                )
            }
            {
                props.level === 1 &&
                (
                    <RenderLink
                        className={classNames('menu_list4middle',
                            {
                                'listOpen' : open && children,
                            }
                        )}
                        onClick={handleOpen}
                    >
                        <p className={open && children ? 'ml-19' : 'ml-26'}>{props.menuName}</p>

                    </RenderLink>
                )
            }
            {
                props.level === 2 &&
                (
                    <RenderLink
                        className='menu_list4small'
                        onClick={handleOpen}
                    >
                        <img
                            className="w-17px h-17px ml-46 mt-auto mb-auto"
                            src={`/icon/show-n.png`}
                            alt={'show-n'}
                        />
                        <p>{props.menuName}</p>
                    </RenderLink>
                )
            }

            {children && open && (
                children.map((route, index) => {
                    return (<ListItemLink key={index} {...route} />)
                })
            )}
        </>
    )
});