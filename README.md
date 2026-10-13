# 234 Card Game

A same-device multiplayer card game website designed for friends to pass one phone/tablet back and forth.

## Included now
- Player count selection: 2-6 players
- Game list filtered by player count
- Game detail page
- How to Play popup
- Fully playable One Card starter game
- Pass-the-phone privacy screen between turns
- Custom 55-card PNG deck

## One Card house rules currently coded
- Match suit or rank on normal turns
- Ace = next player draws 3
- Matching-suit 3 blocks an Ace attack
- Black Joker = draw 5
- Red Joker = draw 7
- Joker attacks can only be passed with another Joker
- After a player takes a Black Joker draw, that player chooses Spades or Clubs
- After a player takes a Red Joker draw, that player chooses Hearts or Diamonds
- First player with 0 cards wins

## Run locally
Open `index.html` in a browser. No server or build step is required.

## GitHub Pages
1. Create a new GitHub repository.
2. Upload everything in this folder, preserving the `assets/cards` folder.
3. Open repository **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.

## Card files
Cards are stored in `assets/cards/` and have clean names such as:
- `AS.png` = Ace of Spades
- `10H.png` = 10 of Hearts
- `QD.png` = Queen of Diamonds
- `KC.png` = King of Clubs
- `black-joker.png`
- `red-joker.png`
- `card-back.png`
