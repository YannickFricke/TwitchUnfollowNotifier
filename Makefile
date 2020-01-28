docker-image:
	docker build -t yannickfricke/twitchunfollownotifier:latest .

docker-run:
	docker run -d --restart=unless-stopped --name=TwitchUnfollowNotifier yannickfricke/twitchunfollownotifier:latest .

docker-stop:
	docker stop TwitchUnfollowNotifier
