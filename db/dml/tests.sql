select t.tweet_msg, t.user_id, t.date_of_tweet, t.number_of_likes, u.user_name 
from tweets t
left join user_profile u on t.user_id = u.user_id;

select c.comment_data, u.user_name 
from 