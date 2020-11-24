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
		table.classList=classList
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
				setHud:str=>hud.innerText=str,
				getChildNodes:()=>_table.childNodes,
				getGameOver:()=>gameOver,
				setGameOver:({player})=>{
					gameOver=true
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
				getMovesLeft:()=>movesLeft
			})),
			hud=realBox.appendChild(makeSpan({
				text:_ultimate?"":`${players[playerIndex]} goes first.`
			}))
		if(_ultimate)_ultimate.addMovesLeft(movesLeft)
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
			getChildNodes,
			getGameOver,
			setGameOver,
			buttonClicked,
			getMovesLeft
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
				let win=checkForWin({board:getGrid(),maxDepth:length})
				if(win.who!==null){
					setGameOver({player:win.who})
					setHud(`${players[win.who]} won!`)
					getChildNodes().forEach((tr,ny)=>
						tr.childNodes.forEach((td,nx)=>{
							td.children[0].disabled=true
							win.boxes.forEach(({x,y})=>{
								if(y===ny&&x===nx)
									td.children[0].disabled=false
							})
						}))
				}else if(getMovesLeft()===0){
					setGameOver({player:null})
					setHud("Draw!"+_ultimate?"":" (no moves left)")
				}else{
					nextPlayer()
					if(!_ultimate)
						setHud(`${getPlayer()} (moves left: ${getMovesLeft()})`)
				}
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
		let actualMovesLeft=0
		return makeGenericBoard({
			_ultimate,
			width,
			height,
			length,
			players,
			table:({
				getGrid,
				setSpotInGrid,
				setHud,
				getPlayer,
				setGameOver,
				getMovesLeft
			})=>makeTableFromGrid({
				grid:getGrid(),
				classList:"ultimate",
				converter:({val,x,y})=>{
					let updateHudCount=()=>{
						if(actualMovesLeft>0)
							setHud(`${getPlayer()} (moves left: ${actualMovesLeft})`)
						else
							setHud("Draw!"+_ultimate?"":" (no moves left)")
					},
						subCallbacks={
							x,
							y,
							setWinner:({playerIndex,movesLeft})=>{
								if(innerTTT){
									actualMovesLeft-=movesLeft
									if(_ultimate)_ultimate.addMovesLeft(-1*movesLeft)
									updateHudCount()
								}else
									console.log("TODO")
								setSpotInGrid({
									x,
									y,
									value:playerIndex
								})
								let win=checkForWin({board:getGrid(),maxDepth:length})
								if(win.who!==null){
									setGameOver({player:win.who})
									setHud(`${players[win.who]} won!`)
									/*getChildNodes().forEach((tr,ny)=>
										tr.childNodes.forEach((td,nx)=>{
											td.children[0].disabled=true
											win.boxes.forEach(({x,y})=>{
												if(y===ny&&x===nx)
													td.children[0].disabled=false
											})
										}))*/
								}
							},
							buttonClicked:({x,y})=>{
								actualMovesLeft--
								if(_ultimate)_ultimate.addMovesLeft(-1)
								updateHudCount()
							},
							addMovesLeft:amount=>{
								actualMovesLeft+=amount
								if(_ultimate)_ultimate.addMovesLeft(amount)
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
