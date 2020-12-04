let makeButton=({label="",callback=null})=>{
	let btn=document.createElement("button")
	if(label===null)
		btn.innerHTML="&nbsp;"
	else
		btn.innerText=label
	btn.onclick=callback
	return btn
},
	makeSpan=({text})=>{
		let span=document.createElement("span")
		span.innerText=text
		return span
	},
	/** Make an array of a given amount of empty strings so we can quickly map
	 * it*/
	makeIterable=amount=>new Array(amount).join(" ").split(" "),
	makeTableFromGrid=({grid,converter,classList})=>{
		let table=document.createElement("table")
		if(classList)table.classList.add(...classList)
		grid.map((row,y)=>{
			let tr=document.createElement("tr")
			row.map((val,x)=>{
				let td=document.createElement("td")
				td.appendChild(converter({val,x,y}))
				tr.appendChild(td)
			})
			table.appendChild(tr)
		})
		return table
	},
	makeButtonTable=({labels,callback})=>
		makeTableFromGrid({
			//Perfect use-case for a monad right here
			grid:labels,
			converter:({val,x,y})=>
				makeButton({
					label:val,
					callback:e=>callback({x,y,e})
				})
		}),
	checkForWin=({board,maxDepth=3})=>{
		let result={
			boxes:[],
			who:null
		},
			checkDirection=({
				changeX=0,
				changeY=0,
				remainingW,
				remainingH,
				x,
				y,
			})=>{
				if(remainingH<maxDepth*changeY||
					remainingW<maxDepth*changeX)return
				result.who=board[y][x]
				result.boxes=[{x,y}]
				for(
					let offset=1;
					result.boxes.length<maxDepth;
					offset++
				){
					let ypos=y+offset*changeY,
						xpos=x+offset*changeX
					if(
						ypos<0||ypos>=board.length||
						xpos<0||xpos>=board[ypos].length||
						result.who!==board[ypos][xpos]
					) {
						result.who=null
						result.boxes=[]
						break
					}
					result.boxes.push({x:xpos,y:ypos})
				}
			}
		for(let y=0; y<board.length; y++){
			let remainingH=board.length-y
			for(let x=0; x<board[y].length; x++){
				let remainingW=board[y].length-x
				if(board[y][x]===null)continue
				//down
				checkDirection({
					changeY:1,
					remainingW:Infinity,
					remainingH,
					x,
					y,
				})
				if(result.boxes.length===maxDepth)return result
				//right
				checkDirection({
					changeX:1,
					remainingW,
					remainingH:Infinity,
					x,
					y,
				})
				if(result.boxes.length===maxDepth)return result
				//diagD
				checkDirection({
					changeX:1,
					changeY:1,
					remainingW,
					remainingH,
					x,
					y,
				})
				if(result.boxes.length===maxDepth)return result
				//diagU
				checkDirection({
					changeX:1,
					changeY:-1,
					remainingW,
					remainingH,
					x,
					y,
				})
				if(result.boxes.length===maxDepth)return result
			}
		}
		return {who:null,boxes:[]};
	},
	makeGenericBoard=({
		width=3,
		height=3,
		length=Math.min(width,height),
		players="XO",
		table,
		setChildrenPlayers,
		lockChildren,
		unlockChildren,
		isUltimate,
		_ultimate
	})=>{
		let grid=makeIterable(height).map(()=>
				makeIterable(width).map(()=>null)),
			gameOver=false,
			movesLeft=height*width,
			playerIndex=0,
			realBox=document.createElement("div"),
			_table=realBox.appendChild(table({
				getPlayer:()=>players[playerIndex],
				getPlayerId:()=>playerIndex,
				nextPlayer:()=>{
					playerIndex++
					if(playerIndex>=players.length)
						playerIndex=0
				},
				setHud:str=>{
					if(!_ultimate) hud.innerText=str
				},
				getGameOver:()=>gameOver,
				setGameOver:({player})=>{
					gameOver=true
					_table.classList.add("disabled")//for css reasons
					if(_ultimate)
						_ultimate.setWinner({
							playerIndex:player,
							movesLeft
						})
				},
				getGrid:()=>grid,
				setSpotInGrid:({x,y,value})=>
					grid[y][x]=value,
				buttonClicked:({x,y})=>{
					movesLeft--
					if(_ultimate)_ultimate.buttonClicked({
						x,
						y
					})
				},
				getMovesLeft:()=>movesLeft,
				updateGui:({win,x,y})=>{
					if(gameOver){
						if(isUltimate&&!_ultimate)console.log("updateGui todo")
						_table.childNodes.forEach((tr,ny)=>
							tr.childNodes.forEach((td,nx)=>{
								let btn=td.children[0]
								btn.disabled=true
								win.boxes.forEach(({x,y})=>{
									if(y===ny&&x===nx)
										btn.classList.add("won")
								})
							}))
					}
					if(_ultimate)_ultimate.updateGui({x,y})
				},
				getWin:()=>checkForWin({board:grid,maxDepth:length})
			})),
			hud=realBox.appendChild(makeSpan({
				text:_ultimate?"":`${players[playerIndex]} goes first.`
			}))
		if(_ultimate){
			_ultimate.addMovesLeft(movesLeft)
			_ultimate.init({
				lock:({disable})=>{
					if(gameOver) return
					if(disable)_table.classList.add("disabled")//for css reasons
					if(isUltimate)lockChildren({disable:true})
					_table.childNodes.forEach((tr,ny)=>
						tr.childNodes.forEach((td,nx)=>{
							let btn=td.children[0]
							btn.disabled=true
							btn.classList.add("disabled")
						}))
				},
				unlock:({disable})=>{
					if(gameOver){
						if(disable) _table.classList.add("won")
						return false
					}
					if(isUltimate){
						unlockChildren()
					}else
						_table.childNodes.forEach((tr,y)=>
							tr.childNodes.forEach((td,x)=>{
								let isNull=grid[y][x]!==null,
									btn=td.children[0]
								btn.disabled=isNull
						}))
					return true
				},
				setPlayer:playerId=>{
					playerIndex=playerId
					if(isUltimate)setChildrenPlayers(playerId)
				}
			})
		}
		return realBox
	},
	makeTicTacToeBoard=({
		width=3,
		height=3,
		length=Math.min(width,height),
		players="XO",
		_ultimate
	})=>makeGenericBoard({
		_ultimate,
		width,
		height,
		length,
		players,
		table:({
			getGrid,
			setSpotInGrid,
			getPlayer,
			getPlayerId,
			nextPlayer,
			setHud,
			getGameOver,
			setGameOver,
			buttonClicked,
			getMovesLeft,
			updateGui,
			getWin
		})=>makeButtonTable({
			labels:getGrid(),
			callback:({x,y,e})=>{
				if(getGameOver())return
				setSpotInGrid({
					x,
					y,
					value:getPlayerId()
				})
				e.target.innerText=getPlayer()
				e.target.disabled=true
				buttonClicked({x,y})
				let win=getWin()
				if(win.who!==null){
					setGameOver({player:win.who})
					setHud(`${players[win.who]} won!`)
				}else if(getMovesLeft()===0){
					setGameOver({player:null})
					setHud("Draw! (no moves left)")
				}else{
					nextPlayer()
					setHud(`${getPlayer()} (moves left: ${getMovesLeft()})`)
				}
				updateGui({win,x,y})
			}
		})
	}),
	makeUltimateBoard=({
		width=3,
		height=3,
		length=Math.min(width,height),
		players="XO",
		innerTTT=true,
		innerData={
			width,
			height,
			length,
			players
		},
		_ultimate
	})=>{
		let actualMovesLeft=0,
			initGrid=makeIterable(height).map(()=>
				makeIterable(width).map(()=>null)),
			lockChildren=args=>
				initGrid.map((row,y)=>
					row.map(({lock},x)=>lock(args))),
			unlockChild=({x,y,disable})=>initGrid[y][x].unlock({disable}),
			unlockChildren=()=>
				initGrid.map((row,y)=>
					row.map(({unlock},x)=>unlock({}))),
			setChildrenPlayers=playerId=>
				initGrid.map((row,y)=>
					row.map(({setPlayer},x)=>setPlayer(playerId)))
		return makeGenericBoard({
			_ultimate,
			width,
			height,
			length,
			players,
			setChildrenPlayers,
			lockChildren,
			unlockChildren,
			isUltimate:true,
			table:({
				getGrid,
				setSpotInGrid,
				setHud,
				getPlayer,
				getPlayerId,
				nextPlayer,
				setGameOver,
				getGameOver,
				getMovesLeft,
				getWin,
				buttonClicked,
				updateGui
			})=>makeTableFromGrid({
				grid:getGrid(),
				converter:({val,x,y})=>{
					let updateHudCount=()=>{
						if(actualMovesLeft>0)
							setHud(`${getPlayer()} (moves left: ${actualMovesLeft})`)
						else setHud("Draw! (no moves left)")
					},
						//These two are so we can access them in weird spots
						outerX=x,
						outerY=y,
						//This is so the win value can be accessed in updateGui
						win={},
						subCallbacks={
							x,
							y,
							setWinner:({playerIndex,movesLeft})=>{
								actualMovesLeft-=movesLeft
								if(_ultimate)_ultimate.addMovesLeft(-1*movesLeft)
								updateHudCount()
								setSpotInGrid({
									x,
									y,
									value:playerIndex
								})
								//Update the win var
								win=getWin()
								if(win.who!==null){
									setGameOver({player:win.who})
									setHud(`${players[win.who]} won!`)
									lockChildren({disable:true})
									win.boxes.forEach(({x,y})=>
										unlockChild({x,y,disable:true}))
								}
							},
							buttonClicked:({x,y})=>{
								actualMovesLeft--
								nextPlayer()
								if(_ultimate)_ultimate.addMovesLeft(-1)
								buttonClicked({x,y})
							},
							updateGui:({x,y})=>{
								if(getGameOver())return
								updateHudCount()
								//Has to be after the win check
								setChildrenPlayers(getPlayerId())
								updateGui({
									win,
									x:outerX,
									y:outerY,
									//x,
									//y
								})
								lockChildren({})
								unlockChild({x,y})||unlockChildren()
							},
							addMovesLeft:amount=>{
								actualMovesLeft+=amount
								if(_ultimate)_ultimate.addMovesLeft(amount)
							},
							init:a=>{
								initGrid[y][x]=a
								a.unlock({})
							}
						}
					innerData._ultimate=subCallbacks
					if (innerTTT)
						return makeTicTacToeBoard(innerData)
					else
						return makeUltimateBoard(innerData)
				}
			})
		})
	}
