<?php
require_once('../../../wp-load.php');

$userStudyTasks = json_decode(file_get_contents('php://input'), true)['userStudyTasks'];

if ($userStudyTasks) {
    global $wpdb;

    $wpdb->insert(
        'wp_tasks',
        array(
            'number_of_clicks' => $userStudyTasks['numberOfClicks'],
            'number_of_interactions' => $userStudyTasks['numberOfInteractions'],
            'number_of_likes_in_one_minute' => $userStudyTasks['numberOfLikesInOneMinute'],
            'time_spent_for_juramentada' => $userStudyTasks['timeSpentForJuramentada'],
            'time_spent_for_sixgon' => $userStudyTasks['timeSpentForSixgon'],
            'time_spent_for_tostadora' => $userStudyTasks['timeSpentForTostadora']
        ),
        array(
            '%d', // number_of_clicks
            '%d', // number_of_interactions
            '%d', // number_of_likes_in_one_minute
            '%f', // time_spent_for_juramentada
            '%f', // time_spent_for_sixgon
            '%f'  // time_spent_for_tostadora
        )
    );

    if ($wpdb->insert_id)
        echo "Datos insertados correctamente";
    else
        echo "Error: " . $wpdb->last_error;
} else
    echo "Error: No se han recibido datos";
?>