#Goal
The goal of this project is to create a collection of games, mostly for my own amusement (but I'm not against developing it for public distribution). 

* The entire project should have a common visual language and style (probably based on google's material design language)
* A common UI should be included with a Digital current time clock with seconds, a comprehensive score display, a game title, a pause button (taking the player to a screen with a "mute" toggle, a "Haptics" toggle, a "Color Blind Mode" toggle, "resume", "back to menu", and "quit" options).
* Games should have satisfying and appropriate audio and haptic feedback along with visual effects and "juice" to keep the player engaged.
* The collection is Mobile-first. The sizing should adapt to fit the screen of the device and the common UI should frame the game itself.
* The collection should be able to run on any device with a web browser (use JavaScript, HTML, and CSS).
*Progress is to be saved both locally and on my GitHub account. 
* The game will be playable through Netlify. 

#Games 

##**Anxiety**
Anxiety is an action puzzle with elements of Bejeweled and Tetris.

* The game takes place on an 8x8 grid
* The game begins with the bottom 4 rows populated with random colored boxes
* Any two boxes can be swapped (they do not have to be adjacent) to create a horizontal or vertical line of 3 or more boxes of the same color
* When a line of 3 or more boxes of the same color is created, those boxes will be removed from the grid and any boxes above them will drop down to settle.
* Above the main grid is a "preview row" of 8 boxes that populate with random colored boxes at a constant interval
* When the preview row completes plus one more time interval, the contents of the preview row will drop into the main grid from the top. The preview row will then begin populating again.
* The dropped boxes will settle on top of the existing boxes in the grid.
* The game ends when a box is already in the top row of the grid when the preview bar drops. 
* Levelling takes place at set scoring milestones. Each level will increase the interval speed. 

The goal of the game is to get as far as possible, clearing boxes quickly enough to prevent the game from ending.

##**Dyslexia**
Dyslexia is Anxiety as a word game.

* The game takes place on an 8x8 grid
* The game begins with the bottom 4 rows populated with random LETTER boxes (using Scrabble letter distribution and scoring rules)
* Letters are tapped to be entered into a word field at the top of the screen (beside it a "backspace" button is available). Words are typed in using available letters in the grid.
* When a word is deemed valid, based on a dictionary, the word will be removed from the grid and any letters above it will drop down to settle.
* An invalid word will give some feedback to the player, but will not remove any letters from the grid.
* Words are 3 or more letters, are recognizable english words, and are not acronyms.  
* Above the main grid is a "preview row" of 8 boxes that populate with random Letter boxes at a set interval
* When the preview row completes plus one more time interval, the contents of the preview row will drop into the main grid from the top. The preview row will then begin populating again.
* The dropped boxes will settle on top of the existing boxes in the grid.
* The game ends when a box is already in the top row of the grid when the preview bar drops. 
* Levelling takes place at set scoring milestones. Each level will increase the interval speed. 

The goal of the game is to get as far as possible, clearing boxes quickly enough to prevent the game from ending.

##**HexEnergy**
SEE THE CONTENTS OF THE HEXENERGY FOLDER
HexEnergy is a game in which a grid of hexagons (by default) has "pipes" and the goal is to align all of the pipes. Each level increases the size of the grid (number of hexagons) and the number of pipes. There can also a setting that can set the number of sides of each node on the grid (squares, pentagons, octagons, etc.).  The game in the HexEnergy folder is a proof of concept but does not necessarily match the visual language of the rest of the project. That should be a priority while preserving the gameplay. 

##**Cryptogram**
SEE THE CONTENTS OF THE "Crypto puzzles" FOLDER
The game is based on a common cryptogram puzzle game in which the player must guess encrypted letters that form a quote or phrase. The game has a "quote bank" of common quotes and phrases as well as use an API for more. Every quote is random while ensuring the same quote won't come up again until all other quotes have been used. The game provided in the folder is a proof of concept but does not necessarily match the visual language of the rest of the project. That should be a priority while preserving the gameplay. 

##**Lights Out**
A standard Lights Out puzzle game, also including an animated Auto Solver feature. 

##**Jewelled**
A Bejeweled clone with a roguelite twist.

* 8x8 grid of "gems" made from Emoji. 
* Adjacent gems can be swapped to create a horizontal or vertical line of 3 or more gems of the same type
* When a line of 3 or more gems of the same type is created, those gems will be removed from the grid and any gems above them will drop down with a tight, brisk, and satisfying animation.
* Each round has a set, and gradually increasing Score Target, as well as a "Cash" reward.  
* Between each round, one of three "perks" can be selected to permanently change the game mechanics. These include increasing the rate of certain gems appearing, bombs (wipe out a horizontal row, a vertical column, the immedialely surrounding gems, all of a certain gem that the bomb is swapped with), eliminating a certain gem, adding new gems, changing the grid size, create a checkpoint,and more. 
* The goal is to get as far as possible until a target score can't be reached, at which point the game is over and resets either to the beginning or to the checkpoint.
