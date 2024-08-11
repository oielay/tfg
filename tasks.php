<?php

$userStudyTasks = json_decode(file_get_contents('php://input'), true);

if ($data) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'tasks';

    $wpdb->insert(
        $table_name,
        array(
            'number_of_total_interactions' => $userStudyTasks['numberOfTotalInteractions'],
            'number_of_likes_or_buys' => $userStudyTasks['numberOfLikesOrBuys'],
            'number_of_text_overflows' => $userStudyTasks['numberOfTextOverflows'],
            'number_of_clicks' => $userStudyTasks['numberOfClicks'],
            'time_spent' => $userStudyTasks['timeSpent'],
        )
    );
}

?>