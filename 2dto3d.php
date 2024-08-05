<?php
/*
Plugin Name: 2dto3d
Description: Este es un plugin personalizado que permite visualizar posts y categorias en 3D
Version: 1.0
Author: Oier Layana
*/

header('Access-Control-Allow-Origin: *');

function get_page_or_category_content() {
    if (!isset($_GET['3Denabled']) || $_GET['3Denabled'] !== 'true' ||
        !isset($_GET['3Dtype']) || empty($_GET['3Dtype']) ||
        !isset($_GET['interaction']) || empty($_GET['interaction'])) {
        return;
    }

    if (is_category() ) {
        $category = get_queried_object();
        $category_id = $category->term_id;

        $data = array(
            'id' => $category_id,
            'name' => $category->name,
            'description' => $category->description,
            'posts' => array()
        );

        $query = new WP_Query(array(
            'cat' => $category_id,
            'posts_per_page' => -1
        ));

        while ($query->have_posts()) {
            $query->the_post();
            $data['posts'][] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'excerpt' => get_the_excerpt(),
                'content' => get_the_content(),
                'thumbnail' => get_the_post_thumbnail_url(),
                'date' => get_the_date(),
                'author' => get_the_author()
            );
        }

        wp_reset_postdata();
    } else if (is_tag()) {
        $tag = get_queried_object();
        $tag_id = $tag->term_id;

        $data = array(
            'id' => $tag_id,
            'name' => $tag->name,
            'description' => $tag->description,
            'posts' => array()
        );

        $query = new WP_Query(array(
            'tag_id' => $tag_id,
            'posts_per_page' => -1
        ));

        while ($query->have_posts()) {
            $query->the_post();
            $data['posts'][] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'excerpt' => get_the_excerpt(),
                'content' => get_the_content(),
                'thumbnail' => get_the_post_thumbnail_url(),
                'date' => get_the_date(),
                'author' => get_the_author()
            );
        }

        wp_reset_postdata();
    } else if (is_singular()) {
        $page_id = get_queried_object_id();
        $page = get_post($page_id);

        if ($page) {
            $data = array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'content' => apply_filters('the_content', $page->post_content),
                'excerpt' => $page->post_excerpt,
                'status' => $page->post_status,
                'name' => $page->post_name,
                'menu_order' => $page->menu_order,
                'thumbnail' => get_the_post_thumbnail_url($page->ID),
                'date' => $page->post_date,
                'author' => get_the_author_meta('display_name', $page->post_author)
            );
        } else {
            $data = 'Pagina no encontrada';
        }
    }

    generate_3d_content($data, is_category(), is_tag());
}
add_action('template_redirect', 'get_page_or_category_content');

function generate_3d_content($data, $is_category = false, $is_tag = false) {
    if (!is_array($data)) {
        if ($is_category)
            echo 'Categoria no encontrada';
        else if ($is_tag)
            echo 'Tag no encontrada';
        else
            echo 'Pagina no encontrada';

        exit;
    }

    $current_option = isset($_GET['interaction']) ? $_GET['interaction'] : get_post_meta(get_the_ID(), '_myplugin_menu_option', true);
?>

    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <?php if (!$is_category && !$is_tag) : ?>
                <meta author="<?php echo $data['author']; ?>"></meta>
                <meta description="<?php echo $data['excerpt']; ?>"></meta>
                <meta date="<?php echo $data['date']; ?>"></meta>
                <meta thumbnail="<?php echo $data['thumbnail']; ?>"></meta>
            <?php endif; ?>
            <title><?php echo $is_category || $is_tag ? $data['name'] : $data['title']; ?></title>
            <script id="3d-js-libraries" type="importmap">
                {
                    "imports": {
                        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                        "three/addons/": "https://unpkg.com/three@0.160.0/examples/",
                        "three-mesh-ui": "https://unpkg.com/three-mesh-ui@6.5.4/build/three-mesh-ui.module.js"
                    }
                }
            </script>

            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet"
                  integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"
                  integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN"
                  crossorigin="anonymous"></script>

            <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . 'assets/css/style.css'; ?>">
            <script type="module" src="<?php echo plugin_dir_url(__FILE__) . 'assets/js/3d-menu.js'; ?>" defer></script>
        </head>
        <body>
            <div class="hist-nav-buttons">
                <button 
                    class="nav-button unselectable"
                    onClick="window.history.back();"
                >
                        ATRÁS
                </button>
                <button 
                    class="nav-button unselectable"
                    onClick="window.history.forward();"
                >
                        ADELANTE
                </button>
            </div>

            <div id="myMenu" class="menu-container">
                <form method="get">
                    <input type="hidden" name="3Denabled" value="true">
                    <label for="interaction"><?php _e('Elige el método de interacción', 'myplugin'); ?></label>
                    <select name="interaction" id="interaction" onchange="this.form.submit()">
                        <option value="orbitControls" <?php selected($current_option, 'orbitControls'); ?>>Controles de órbita</option>
                        <option value="deviceOrientationControls" <?php selected($current_option, 'deviceOrientationControls'); ?>>Controles de orientación de dispositivo</option>
                    </select>
                </form>

                <div>
                    <label for="instrucciones"><?php _e('Instrucciones', 'myplugin'); ?></label>
                    <div id="instrucciones" class="instrucciones">
                        <div>
                            <button class="interaction-name" data-bs-toggle="modal" data-bs-target="#staticBackdropInstructions">Abrir instrucciones</button>
                            <div class="modal fade" id="staticBackdropInstructions" data-bs-backdrop="false" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                <div class="modal-dialog modal-lg">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h2 class="modal-title" id="staticBackdropLabel">INSTRUCCIONES</h2>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
                                        <div class="modal-body">
                                            <h4>Controles de órbita</h4>
                                            <p>Utilice los siguientes controles para interactuar con el contenido en 3D:</p>
                                            <ul>
                                                <li><strong>Movimiento:</strong> Utilice dos dedos y deslícelos en la dirección deseada.</li>
                                                <li><strong>Orientación y rotación:</strong> Utilice un dedo y deslícelo para rotar la vista de la cámara.</li>
                                                <li><strong>Pulsado:</strong> Pulse con un dedo en el lugar deseado.</li>
                                            </ul>

                                            <br><br>

                                            <h4>Controles de orientación de dispositivo</h4>
                                            <p>Utilice los siguientes controles para interactuar con el contenido en 3D:</p>
                                            <ul>
                                                <li><strong>Movimiento:</strong> Utilize los botones de adelante y atrás para avanzar y retroceder en el espacio.</li>
                                                <li><strong>Orientación y rotación:</strong> Incline o gire su dispositivo para cambiar la vista de la cámara.</li>
                                                <li><strong>Pulsado:</strong> Pulse con un dedo en el lugar deseado.</li>
                                            </ul>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>      
            </div>

            <button id="menubtn" class="menubtn unselectable">&#9776; Abrir Menú</button>

            <div id="move-buttons" class="move-buttons">
                <button 
                    id="move-forward"
                    class="move-button unselectable"
                >
                    &uarr;
                </button>
                <button
                    id="move-backward"
                    class="move-button unselectable"
                >
                    &darr;
                </button>
            </div>
            
            <div id="notification" class="notification">
                <img id="notification-image"></img>
                <div id="notification-text"></div>
            </div>

<?php
            if ($_GET['interaction'] === 'deviceOrientationControls' && !wp_is_mobile()) {
                echo '<div class="interaction-error">Esta función solo está disponible en dispositivos móviles. Redirigiendo a los controles de órbita...</div>';
                echo '<script>setTimeout(function() { window.location.href = window.location.href.replace("interaction=deviceOrientationControls", "interaction=orbitControls"); }, 3000);</script>';
            } else {
                switch ($_GET['3Dtype']) {
                    case 'armoire':
                        echo '<script type="module" src="' . plugin_dir_url(__FILE__) . 'assets/js/armoire.js"></script>';
                        echo '<script>var content = ' . json_encode($data['posts']) . ';</script>';
                        break;
                    case 'pointAndClick':
                        echo '<script type="module" src="' . plugin_dir_url(__FILE__) . 'assets/js/pointAndClick.js"></script>';
                        echo '<script>var content = ' . json_encode($data['content']) . '; var title = ' . json_encode($data['title']) .';</script>';
                        break;
                    // case 'galaxy':
                    //     echo '<script src="' . plugin_dir_url(__FILE__) . 'assets/js/galaxy.js"></script>';
                    //     break;
                    // case 'museum':
                    //     echo '<script src="' . plugin_dir_url(__FILE__) . 'assets/js/museum.js"></script>';
                    //     break;
                    default:
                        echo '<script src="' . plugin_dir_url(__FILE__) . 'assets/js/pointAndClick.js"></script>';
                        echo '<script>build_dashboard(' . json_encode($data) . ');</script>';
                        break;
                }
            }
?>
        </body>
    </html>
<?php
    exit;
}

function myplugin_add_meta_box() {
    add_meta_box(
        'myplugin_meta_box_id',
        __('Método de interacción 3D', 'myplugin'),
        'myplugin_meta_box_callback',
        'post',
        'side'
    );
}
add_action('add_meta_boxes', 'myplugin_add_meta_box');

function myplugin_meta_box_callback($post) {
    // Retrieve the current value
    $selected = get_post_meta($post->ID, '_myplugin_menu_option', true);
    wp_nonce_field('myplugin_save_meta_box_data', 'myplugin_meta_box_nonce');
    ?>
    <label for="myplugin_menu_option"><?php _e('Elige el método de interacción:', 'myplugin'); ?></label>
    <select name="myplugin_menu_option" id="myplugin_menu_option">
        <option value="orbitControls" <?php selected($selected, 'orbitControls'); ?>>Controles de órbita</option>
        <option value="deviceOrientationControls" <?php selected($selected, 'deviceOrientationControls'); ?>>Controles de orientación de dispositivo</option>
    </select>
    <?php
}

function myplugin_save_postdata($post_id) {
    if (!isset($_POST['myplugin_meta_box_nonce']) || !wp_verify_nonce($_POST['myplugin_meta_box_nonce'], 'myplugin_save_meta_box_data')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    if (array_key_exists('myplugin_menu_option', $_POST)) {
        update_post_meta(
            $post_id,
            '_myplugin_menu_option',
            $_POST['myplugin_menu_option']
        );
    }
}
add_action('save_post', 'myplugin_save_postdata');

function myplugin_add_default_url_params() {
    if (is_admin() || !is_singular() && !is_category() && !is_tag()) {
        return;
    }

    $params = array(
        '3Denabled' => 'true',
        '3Dtype' => '',
        'interaction' => ''
    );

    if (is_singular()) {
        $params['3Dtype'] = 'pointAndClick';
        $params['interaction'] = get_post_meta(get_the_ID(), '_myplugin_menu_option', true) ?: 'orbitControls';
    } elseif (is_category() || is_tag()) {
        $params['3Dtype'] = 'armoire';
        $params['interaction'] = 'orbitControls';
    }

    global $wp;
    $current_url = home_url($wp->request);
    $current_query_params = $_GET;

    if (!isset($current_query_params['3Denabled'])) {
        $current_query_params['3Denabled'] = 'true';
    }

    $new_params = array_merge($params, $current_query_params);

    if ($new_params !== $current_query_params) {
        wp_redirect(add_query_arg($new_params, $current_url));
        exit;
    }
}
add_action('template_redirect', 'myplugin_add_default_url_params');

?>