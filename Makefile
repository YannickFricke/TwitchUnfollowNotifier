docker-image:
	docker build -t yannickfricke/twitchunfollownotifier:latest .

run:
	docker run -d --restart=unless-stopped yannickfricke/twitchunfollownotifier:latest .