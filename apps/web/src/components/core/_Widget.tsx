// import { Card } from "@/components/core/Card";
// import { useWidgets } from "@/hooks/providers/WidgetProvider";
// import { useGame } from "@/hooks/useGame";
// import { KeybindActionKeys } from "@primodiumxyz/game/src/lib/constants/keybinds";
// import { SceneKeys } from "@primodiumxyz/game/src/lib/constants/common";
// import { usePersistentStore } from "@primodiumxyz/game/src/stores/PersistentStore";
// import { useCore } from "@primodiumxyz/core/react";
// import { Coord } from "@primodiumxyz/engine/types";
// import { ReactNode, memo, useCallback, useEffect, useMemo, useState } from "react";
// import ReactDOM from "react-dom";
// import { FaMinus, FaRegWindowMaximize, FaRegWindowRestore } from "react-icons/fa";
// import { RiPushpinFill, RiUnpinFill } from "react-icons/ri";

// type WidgetProps = {
//   title: string;
//   scene: SceneKeys;
//   id: string;
//   defaultCoord: Coord;
//   children: ReactNode;
//   draggable?: boolean;
//   minOpacity?: number;
//   persist?: boolean;
//   hotkey?: KeybindActionKeys;
//   pinnable?: boolean;
//   lockable?: boolean;
//   defaultPinned?: boolean;
//   defaultLocked?: boolean;
//   defaultVisible?: boolean;
//   icon: string;
//   active?: boolean;
//   popUp?: boolean;
//   origin?:
//     | "top-left"
//     | "top-right"
//     | "bottom-left"
//     | "bottom-right"
//     | "center"
//     | "center-left"
//     | "center-right"
//     | "center-top"
//     | "center-bottom";
//   noBorder?: boolean;
//   topBar?: boolean;
// };

// type WidgetContentProps = {
//   id: string;
//   title?: string;
//   icon?: string;
//   onDoubleClick?: () => void;
//   onMouseDown?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
//   onPointerEnter?: () => void;
//   onPointerLeave?: () => void;
//   onClose?: () => void;
//   onMinimize?: () => void;
//   onMaximize?: () => void;
//   onPin?: () => void;
//   onUnpin?: () => void;
//   onLock?: () => void;
//   onUnlock?: () => void;
//   popUp: boolean;
//   pinned: boolean;
//   minimized: boolean;
//   children?: ReactNode;
//   origin:
//     | "top-left"
//     | "top-right"
//     | "bottom-left"
//     | "bottom-right"
//     | "center"
//     | "center-left"
//     | "center-right"
//     | "center-top"
//     | "center-bottom";
//   locked?: boolean;
//   noBorder?: boolean;
//   topBar?: boolean;
// };

// let pinnedDepth = -10000;
// let unpinnedDepth = 10000;

// export const Content: React.FC<WidgetContentProps> = memo(
//   ({
//     id,
//     title,
//     icon,
//     onDoubleClick,
//     onMouseDown,
//     onPointerEnter,
//     onPointerLeave,
//     onClose,
//     onPin,
//     onUnpin,
//     pinned,
//     minimized,
//     children,
//     origin,
//     locked,
//     onLock,
//     onUnlock,
//     popUp,
//     noBorder: noBorder,
//     topBar = false,
//   }) => {
//     const [uiScale] = usePersistentStore((state) => [state.uiScale]);

//     // Calculate translate values based on 'origin'
//     const { translateX, translateY, transformOrigin } = useMemo(() => {
//       let translateX = "0px";
//       let translateY = "0px";
//       let transformOriginValue = "center";

//       switch (origin) {
//         case "top-left":
//           transformOriginValue = "top left";
//           break;
//         case "top-right":
//           translateX = "-100%";
//           transformOriginValue = "top right";
//           break;
//         case "bottom-left":
//           translateY = "-100%";
//           transformOriginValue = "bottom left";
//           break;
//         case "bottom-right":
//           translateX = "-100%";
//           translateY = "-100%";
//           transformOriginValue = "bottom right";
//           break;
//         case "center":
//           translateX = "-50%";
//           translateY = "-50%";
//           transformOriginValue = "center";
//           break;
//         case "center-right":
//           translateX = "-100%";
//           translateY = "-50%";
//           transformOriginValue = "center right";
//           break;
//         case "center-left":
//           translateY = "-50%";
//           transformOriginValue = "center left";
//           break;
//         case "center-top":
//           translateX = "-50%";
//           transformOriginValue = "top";
//           break;
//         case "center-bottom":
//           translateX = "-50%";
//           translateY = "-100%";
//           transformOriginValue = "bottom";
//           break;
//       }

//       return { translateX, translateY, transformOrigin: transformOriginValue };
//     }, [origin]);

//     return (
//       <div
//         id={id + "_content"}
//         key={id + "_content"}
//         style={{
//           transform: `translate(${translateX}, ${translateY}) scale(${!locked ? uiScale : 1})`,
//           transformOrigin: transformOrigin,
//         }}
//         className={`relative min-w-44 w-fit transition-opacity duration-600 pointer-events-auto select-none ${
//           noBorder ? "ring-0" : "ring-1"
//         } ${!pinned && !minimized ? " ring-secondary" : ""} ${locked ? "" : ""}`}
//         onPointerEnter={onPointerEnter}
//         onPointerLeave={onPointerLeave}
//       >
//         {topBar && (
//           <div
//             className={`flex p-1 text-xs items-center gap-3 justify-between w-full cursor-move ring-1 ring-secondary ${
//               locked ? "bg-info/50 cursor-default" : pinned ? "bg-neutral/75" : "bg-secondary/50"
//             }`}
//             onPointerDown={onMouseDown}
//             onDoubleClick={onDoubleClick}
//           >
//             {/* Title */}
//             <div className="flex gap-1 bg-gray-900 px-2 items-center">
//               {icon && <img src={icon} className="pixel-images h-5" draggable="false" />}
//               <p className=" uppercase font-bold">{title}</p>
//             </div>

//             {!popUp && (
//               <div className="flex items-center gap-1">
//                 {
//                   <>
//                     {!pinned && onPin && <RiPushpinFill className="cursor-crosshair" onClick={onPin} />}
//                     {pinned && onUnpin && <RiUnpinFill className="cursor-crosshair" onClick={onUnpin} />}
//                   </>
//                 }

//                 {locked && onUnlock && <FaRegWindowRestore className="cursor-pointer" onClick={onUnlock} />}
//                 {!locked && onLock && <FaRegWindowMaximize className="cursor-pointer" onClick={onLock} />}
//                 {/* {!minimized && onMinimize && <FaMinus className="cursor-nesw-resize" onClick={onMinimize} />}
//             {minimized && onMaximize && <FaPlus className="cursor-nesw-resize" onClick={onMaximize} />} */}
//                 {onClose && <FaMinus className="cursor-pointer" onClick={onClose} />}
//               </div>
//             )}
//           </div>
//         )}

//         {noBorder ? (
//           <div className={`relative !p-0 min-w-72 ${minimized ? "!border-0 h-0 overflow-hidden opacity-0" : ""}`}>
//             {children}
//           </div>
//         ) : (
//           <Card
//             className={`relative !p-0 min-w-72 border border-t-success border-secondary ${
//               minimized ? "!border-0 h-0 overflow-hidden opacity-0" : ""
//             }`}
//           >
//             {children}
//           </Card>
//         )}
//       </div>
//     );
//   }
// );

// export const Widget: React.FC<WidgetProps> = memo(
//   ({
//     title,
//     scene,
//     id,
//     icon,
//     defaultCoord,
//     children,
//     draggable = false,
//     minOpacity = 0.5,
//     origin = "top-left",
//     persist = false,
//     pinnable = false,
//     lockable = false,
//     hotkey,
//     defaultPinned = false,
//     defaultLocked = false,
//     defaultVisible = false,
//     popUp = false,
//     active = true,
//     noBorder = false,
//     topBar = false,
//   }) => {
//     const { tables } = useCore();
//     const game = useGame();
//     const [paneInfo, setPane, removePane] = usePersistentStore((state) => [
//       state.panes,
//       state.setPane,
//       state.removePane,
//     ]);
//     const [container, setContainer] = useState<Phaser.GameObjects.DOMElement>();
//     const [containerRef, setContainerRef] = useState<HTMLDivElement>();
//     const [minimized, setMinimized] = useState(false);
//     const [dragging, setDragging] = useState(false);
//     const [dragOffset, setDragOffset] = useState<Coord>({ x: 0, y: 0 });
//     const [pinned, setPinned] = useState(paneInfo[id]?.pinned ?? (scene === "UI" ? false : defaultPinned));
//     const [locked, setLocked] = useState(paneInfo[id]?.locked ?? defaultLocked);
//     // const [coord, setCoord] = useState<Coord>(paneInfo[id]?.coord ?? defaultCoord);
//     const [visible, setVisible] = useState(paneInfo[id]?.visible ?? defaultVisible);
//     const { setWidget, updateWidget } = useWidgets();

//     const coord = useMemo(() => {
//       if (paneInfo[id]?.coord) {
//         return paneInfo[id]?.coord ?? { x: 0, y: 0 };
//       }
//       return defaultCoord;
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [id, defaultCoord]);

//     const [camera, uiCamera] = useMemo(() => {
//       const { camera } = game[scene];
//       const { camera: uiCamera } = game.UI;

//       return [camera, uiCamera];
//     }, [game, scene]);

//     const createContainer = useCallback(
//       (_camera: typeof camera, _coord: Coord, raw: boolean) => {
//         if (container) {
//           container.destroy();
//         }

//         const { container: _container, obj } = _camera.createDOMContainer(id, _coord, raw);
//         obj.pointerEvents = "none";
//         obj.setAlpha(pinned ? minOpacity : 1);
//         obj.setDepth(pinned || defaultPinned ? pinnedDepth : unpinnedDepth);
//         setContainer(obj);
//         setContainerRef(_container);
//         return obj;
//       },
//       [container, id, minOpacity, pinned, defaultPinned]
//     );

//     // reset on double click to default
//     const handleReset = useCallback(() => {
//       setPinned(defaultPinned);
//       setLocked(defaultLocked);
//       setVisible(defaultVisible);
//       setMinimized(false);
//       setDragging(false);
//       setDragOffset({ x: 0, y: 0 });
//       if (persist) setPane(id, defaultCoord, defaultPinned, defaultLocked, defaultVisible);

//       // set
//       const newContainer = createContainer(defaultPinned ? camera : uiCamera, defaultCoord, true);
//       newContainer.setDepth(defaultPinned ? pinnedDepth : unpinnedDepth);
//       newContainer.setAlpha(defaultPinned ? minOpacity : 1);
//     }, [
//       defaultPinned,
//       defaultCoord,
//       setPane,
//       id,
//       createContainer,
//       camera,
//       uiCamera,
//       minOpacity,
//       defaultLocked,
//       defaultVisible,
//       persist,
//     ]);

//     // calculate drag offset, set depth and set dragging flag
//     const handleMouseDown = useCallback(
//       (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
//         if (!container) return;

//         const originPixelCoord = (!pinned ? uiCamera : camera).screenCoordToWorldCoord({
//           x: event.clientX,
//           y: event.clientY,
//         });

//         setDragOffset({ x: originPixelCoord.x - container.x, y: originPixelCoord.y - container.y });
//         if (pinned) {
//           container.setDepth(pinnedDepth + 1);
//           pinnedDepth++;
//         } else {
//           container.setDepth(unpinnedDepth + 1);
//           unpinnedDepth++;
//         }
//         setDragging(true);
//       },
//       [setDragOffset, container, pinned, uiCamera, camera, setDragging]
//     );

//     const handlePin = useCallback(() => {
//       if (!container) return;

//       setPinned(true);
//       const worldCoord = camera.screenCoordToWorldCoord({ x: container.x, y: container.y });
//       const newContainer = createContainer(camera, worldCoord, true);
//       // newContainer.setDepth(pinnedDepth);
//       newContainer.setAlpha(1);
//       if (persist) {
//         setPane(id, worldCoord, true, false, true);
//       }
//     }, [setPinned, camera, container, createContainer, persist, setPane, id]);

//     const handleUnpin = useCallback(() => {
//       if (!container) return;

//       setPinned(false);
//       const screenCoord = camera.worldCoordToScreenCoord({ x: container.x, y: container.y });
//       const newContainer = createContainer(uiCamera, screenCoord, true);
//       newContainer.setDepth(unpinnedDepth);
//       newContainer.setAlpha(1);
//       if (persist) {
//         setPane(id, screenCoord, false, false, true);
//       }
//     }, [setPinned, camera, container, createContainer, uiCamera, persist, setPane, id]);

//     const toggleMinimize = useCallback(() => {
//       setMinimized(!minimized);
//     }, [minimized, setMinimized]);

//     const handleLock = useCallback(() => {
//       setLocked(true);
//       if (persist) setPane(id, coord, pinned, true, true);
//     }, [setLocked, persist, setPane, id, coord, pinned]);

//     const handleUnlock = useCallback(() => {
//       const contentRef = document.getElementById(id + "_content");
//       if (!contentRef) return;
//       const contentBounds = contentRef.getBoundingClientRect();

//       let translatedX = 0;
//       let translatedY = 0;

//       switch (origin) {
//         case "top-right":
//           translatedX = contentBounds.width; // Entirely to the left
//           break;
//         case "bottom-left":
//           translatedY = contentBounds.height; // Entirely up
//           break;
//         case "bottom-right":
//           translatedX = contentBounds.width; // Entirely to the left
//           translatedY = contentBounds.height; // Entirely up
//           break;
//         case "center":
//           translatedX = contentBounds.width / 2; // Center horizontally
//           translatedY = contentBounds.height / 2; // Center vertically
//           break;
//         case "center-right":
//           translatedX = contentBounds.width; // Entirely to the left
//           translatedY = contentBounds.height / 2; // Center vertically
//           break;
//         case "center-left":
//           translatedY = contentBounds.height / 2; // Center vertically
//           break;
//         case "center-top":
//           translatedX = contentBounds.width / 2; // Center horizontally
//           break;
//         case "center-bottom":
//           translatedX = contentBounds.width / 2; // Center horizontally
//           translatedY = contentBounds.height; // Entirely up
//           break;
//       }

//       const screenCoord = {
//         x: contentBounds.left + window.scrollX + translatedX,
//         y: contentBounds.top + window.scrollY + translatedY,
//       };

//       // const screenCoord = camera.worldCoordToScreenCoord({ x: container.x, y: container.y });
//       const newContainer = createContainer(uiCamera, screenCoord, true);
//       newContainer.setDepth(unpinnedDepth);
//       newContainer.setAlpha(1);

//       setLocked(false);
//       setPinned(false);
//       if (persist) setPane(id, screenCoord, false, false, true);
//     }, [setLocked, id, setPane, persist, createContainer, uiCamera, origin]);

//     const handlePointerEnter = useCallback(() => {
//       if (!container) return;

//       // remove any hovered entity as Phaser will have failed to detect the pointer leaving
//       tables.HoverEntity.remove();

//       if (pinned) {
//         container.setAlpha(1);
//       }
//     }, [pinned, container]);

//     const handlePointerLeave = useCallback(() => {
//       if (!container) return;

//       if (pinned && !dragging) {
//         container.setAlpha(minOpacity);
//       }
//     }, [pinned, dragging, container, minOpacity]);

//     const handleClose = useCallback(() => {
//       if (!active) return;
//       setVisible(false);
//       if (persist) setPane(id, coord, pinned, locked, false);
//     }, [active, persist, setPane, id, coord, pinned, locked]);

//     const handleOpen = useCallback(() => {
//       if (!active) return;
//       setVisible(true);
//       if (persist) setPane(id, coord, pinned, locked, true);
//     }, [active, persist, setPane, id, coord, pinned, locked]);

//     //initialize phaser container
//     useEffect(() => {
//       createContainer(pinned ? camera : uiCamera, coord, true);

//       return () => {
//         if (container) container.destroy();
//       };
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [coord]);

//     //scale container with camera zoom. Do not scale if pinned
//     useEffect(() => {
//       if (!container || !pinned) return;

//       container.scale = 1 / camera.phaserCamera.zoom;

//       const sub = camera.zoom$.subscribe((zoom) => {
//         container.scale = 1 / zoom;
//       });

//       return () => {
//         sub.unsubscribe();
//       };
//     }, [scene, container, pinned, camera]);

//     //handle dragging
//     useEffect(() => {
//       if (!draggable) return;
//       const handleMouseMove = (event: MouseEvent) => {
//         if (dragging) {
//           requestAnimationFrame(() => {
//             const newPixelPosition = (!pinned ? uiCamera : camera).screenCoordToWorldCoord({
//               x: event.clientX,
//               y: event.clientY,
//             });

//             const newCoord = { x: newPixelPosition.x - dragOffset.x, y: newPixelPosition.y - dragOffset.y };

//             container?.setPosition(newCoord.x, newCoord.y);
//           });
//         }
//       };

//       const handleMouseUp = () => {
//         if (dragging) {
//           if (!container) return;

//           persist && setPane(id, container, pinned, false, true);
//         }

//         setDragging(false);
//       };

//       document.addEventListener("mousemove", handleMouseMove);
//       document.addEventListener("mouseup", handleMouseUp);

//       return () => {
//         document.removeEventListener("mousemove", handleMouseMove);
//         document.removeEventListener("mouseup", handleMouseUp);
//       };
//     }, [dragging, draggable, dragOffset, container, pinned, camera, uiCamera, id, setPane, persist]);

//     useEffect(() => {
//       const handleResize = () => {
//         if (!container || pinned) return;

//         if (!uiCamera.phaserCamera.worldView.contains(container.x, container.y)) {
//           handleReset();
//         }
//       };

//       window.addEventListener("resize", handleResize);

//       return () => {
//         window.removeEventListener("resize", handleResize);
//       };
//     }, [pinned, container, camera, defaultCoord, id, removePane, createContainer, uiCamera, minOpacity, handleReset]);

//     useEffect(() => {
//       updateWidget(title, {
//         visible,
//         minimized,
//         pinned,
//         open: handleOpen,
//         close: handleClose,
//         reset: handleReset,
//         active,
//       });
//     }, [visible, minimized, pinned, active, updateWidget, title]);

//     useEffect(() => {
//       if (!popUp)
//         setWidget({
//           name: title,
//           visible,
//           close: handleClose,
//           open: handleOpen,
//           hotkey,
//           pinned,
//           minimized,
//           image: icon,
//           reset: handleReset,
//           active,
//         });
//     }, []);

//     // if (!containerRef || !container || !visible) return null;

//     if (locked)
//       return (
//         <>
//           {containerRef && container && visible && active && (
//             <div key={id}>
//               <Content
//                 id={id}
//                 title={title}
//                 icon={icon}
//                 minimized={minimized}
//                 pinned={false}
//                 origin={"top-left"}
//                 onClose={handleClose}
//                 locked={locked}
//                 onUnlock={lockable ? handleUnlock : undefined}
//                 onLock={lockable ? handleLock : undefined}
//                 onMinimize={toggleMinimize}
//                 onMaximize={toggleMinimize}
//                 popUp={popUp}
//                 noBorder={noBorder}
//                 topBar={topBar}
//               >
//                 {children}
//               </Content>
//             </div>
//           )}
//         </>
//       );

//     return ReactDOM.createPortal(
//       <>
//         {containerRef && container && visible && active && (
//           <div key={id} className="animate-in fade-in zoom-in-90 slide-in-from-top-5">
//             <Content
//               id={id}
//               title={title}
//               icon={icon}
//               onPointerEnter={handlePointerEnter}
//               onPointerLeave={handlePointerLeave}
//               minimized={minimized}
//               onPin={pinnable && scene !== "UI" ? handlePin : undefined}
//               onUnpin={pinnable && scene !== "UI" ? handleUnpin : undefined}
//               pinned={pinned}
//               onMouseDown={handleMouseDown}
//               onDoubleClick={handleReset}
//               onMinimize={toggleMinimize}
//               onMaximize={toggleMinimize}
//               onClose={handleClose}
//               onLock={lockable ? handleLock : undefined}
//               onUnlock={lockable ? handleUnlock : undefined}
//               origin={origin}
//               popUp={popUp}
//               noBorder={noBorder}
//               topBar={topBar}
//             >
//               {children}
//             </Content>
//           </div>
//         )}
//       </>,
//       containerRef ?? document.body
//     );
//   }
// );
