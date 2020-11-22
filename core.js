let makeButton=({label="",callback=null})=>{
	let btn=document.createElement("button")
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
	makeTableFromGrid=({grid,converter})=>{
		let table=document.createElement("table")
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
	makeTicTacToeBoard=({
		container,
		width=3,
		height=3,
		length=Math.min(width,height)
	})=>{
		let gameOver=false,
			player="X",
			boardData=makeIterable(height).map(()=>
				makeIterable(width).map(()=>null)),
			movesLeft=height*width,
			realBox=container.appendChild(document.createElement("div")),
			table=realBox.appendChild(makeButtonTable({
				labels:boardData.map(v=>v.map(()=>"?")),
				callback:({x,y,e})=>{
					if(gameOver)return
					boardData[y][x]=player
					e.target.innerText=player
					e.target.disabled=true
					movesLeft--
					if(movesLeft===0){
						gameOver=true
						playerIndicator.innerText=`Draw! (no moves left)`
						//Update for recursive games
						player=null
						return
					}
					let win=checkForWin({board:boardData,maxDepth:length})
					if(win.who!==null){
						gameOver=true
						player=win.who
						playerIndicator.innerText=`${player} won!`
						table.childNodes.forEach((tr,ny)=>
							tr.childNodes.forEach((td,nx)=>{
								td.children[0].disabled=true
								win.boxes.forEach(({x,y})=>{
									if(y===ny&&x===nx)
										td.children[0].disabled=false
								})
							}))
					}else{
						player=player==="X"?"O":"X"
						playerIndicator.innerText=`${player} (moves left: ${movesLeft})`
					}
				}
			})),
			playerIndicator=realBox.appendChild(makeSpan({
				text:`${player} goes first.`
			}))
	}
