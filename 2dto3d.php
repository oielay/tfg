<?php
/*
Plugin Name: 2dto3d
Description: Este es un plugin personalizado que permite visualizar posts y categorias en 3D. Proporciona una experiencia interactiva y envolvente para los usuarios al explorar el contenido de su sitio web de WordPress. El plugin utiliza tecnologías como WebGL y Three.js para renderizar los elementos en 3D y ofrece diferentes entornos 3D, como una armería o un museo, para que los usuarios elijan. Además, admite diferentes métodos de interacción, como controles de órbita y controles de orientación de dispositivo, para que los usuarios puedan explorar el contenido de manera intuitiva. Este plugin es ideal para sitios web que desean agregar un toque visualmente atractivo y único a su contenido. 
Version: 1.0
Author: Oier Layana
*/

header('Access-Control-Allow-Origin: *');

function enqueue_conventional_web_2d_script() {
    if (!isset($_GET['3Denabled']) || $_GET['3Denabled'] !== 'true')
        wp_enqueue_script('conventional-web-2d', plugin_dir_url(__FILE__) . 'assets/js/conventionalWeb2d.js', array(), '1.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_conventional_web_2d_script');

function get_page_or_category_content() {
    if (!isset($_GET['3Denabled']) || $_GET['3Denabled'] !== 'true' ||
        !isset($_GET['3Dtype']) || empty($_GET['3Dtype']) ||
        !isset($_GET['interaction']) || empty($_GET['interaction']))
        return;

    if (is_category()) {
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
            
            $content = get_the_content();

            $links = wp_extract_urls($content);
    
            $filtered_links = array_filter($links, function($url) {
                $image_extensions = array('jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg');
                
                $extension = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
                
                return !in_array(strtolower($extension), $image_extensions);
            });
            
            $data['posts'][] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'excerpt' => get_the_excerpt(),
                'content' => $content,
                'thumbnail' => get_the_post_thumbnail_url(),
                'date' => get_the_date(),
                'author' => get_the_author(),
                'links' => $filtered_links
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
            
            $content = get_the_content();

            $links = wp_extract_urls($content);
    
            $filtered_links = array_filter($links, function($url) {
                $image_extensions = array('jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg');
                
                $extension = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
                
                return !in_array(strtolower($extension), $image_extensions);
            });
            
            $data['posts'][] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'excerpt' => get_the_excerpt(),
                'content' => $content,
                'thumbnail' => get_the_post_thumbnail_url(),
                'date' => get_the_date(),
                'author' => get_the_author(),
                'links' => $filtered_links
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

    $current_interaction = isset($_GET['interaction']) ? $_GET['interaction'] : get_post_meta(get_the_ID(), '_interaction_option', true);
    
    if ($is_category || $is_tag)
        $current_environment = isset($_GET['3Dtype']) ? $_GET['3Dtype'] : get_term_meta(get_queried_object_id(), '_environment_option', true);
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

            <?php if ($_GET['3Dtype'] === 'galaxy') : ?>
                <script src="//unpkg.com/3d-force-graph"></script>
            <?php else : ?>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet"
                    integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"
                    integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN"
                    crossorigin="anonymous"></script>
            <?php endif; ?>

            <script id="3d-js-libraries" type="importmap">
                {
                    "imports": {
                        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                        "three/addons/": "https://unpkg.com/three@0.160.0/examples/",
                        "three-mesh-ui": "https://unpkg.com/three-mesh-ui@6.5.4/build/three-mesh-ui.module.js"
                    }
                }
            </script>

            <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . 'assets/css/style.css'; ?>">
            <script type="module" src="<?php echo plugin_dir_url(__FILE__) . 'assets/js/3d-menu.js'; ?>" defer></script>
            <script src="<?php echo plugin_dir_url(__FILE__) . 'assets/js/joy.js'; ?>"></script>
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
                <?php if ($_GET['3Dtype'] !== 'galaxy') : ?>
                    <form method="get">
                        <input type="hidden" name="3Denabled" value="true">
                        <input type="hidden" name="3Dtype" value="<?php echo $_GET['3Dtype']; ?>">
                        <label for="interaction"><?php _e('Elige el método de interacción', 'myplugin'); ?></label>
                        <div>
                            <select name="interaction" id="interaction" onchange="this.form.submit()">
                                <option value="orbitControls" <?php selected($current_interaction, 'orbitControls'); ?>>Controles de órbita</option>
                                <option value="deviceOrientationControls" <?php selected($current_interaction, 'deviceOrientationControls'); ?>>Controles de orientación de dispositivo</option>
                            </select>
                            <span class="interaction-info" data-bs-toggle="modal" data-bs-target="#staticBackdropInstructions">&#8505;</span>
                        </div>
                    </form>

                    <div class="modal fade" id="staticBackdropInstructions" data-bs-backdrop="false" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                        <div class="modal-dialog modal-xl">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h2 class="modal-title" id="staticBackdropLabel">INSTRUCCIONES</h2>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <h4>Controles de órbita</h4>
                                    <p>Utilice los siguientes controles para interactuar con el contenido en 3D:</p>
                                    <ul>
                                        <li><strong>Movimiento:</strong> Utilice dos dedos y deslícelos en la dirección a la que desea mover el espacio visualizado.</li>
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
                <?php endif; ?>
                
                <?php if (is_category() || is_tag()) : ?>
                    <form id="3Denv" method="get">
                        <input type="hidden" name="3Denabled" value="true">
                        <label for="3Dtype"><?php _e('Elige el entorno 3D', 'myplugin'); ?></label>
                        <select name="3Dtype" id="environment" onchange="this.form.submit()">
                            <option value="armoire" <?php selected($current_environment, 'armoire'); ?>>Armería</option>
                            <option value="museum" <?php selected($current_environment, 'museum'); ?>>Museo</option>
                            <option value="galaxy" <?php selected($current_environment, 'galaxy'); ?>>Galaxia</option>
                        </select>
                        <input type="hidden" name="interaction" value="<?php echo $_GET['interaction']; ?>">
                    </form>
                <?php endif; ?>
            </div>

            <button id="menubtn" class="menubtn unselectable">&#9776; Abrir Menú</button>

            <div id="joystick" class="joy"></div>
            
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
                    case 'museum':
                        echo '<script type="module" src="' . plugin_dir_url(__FILE__) . 'assets/js/museum.js"></script>';

                        $groupedPosts = array();
                        foreach ($data['posts'] as $post) {
                            if ($is_category) {
                                $subgroups = wp_get_post_tags($post['id'], array('fields' => 'slugs'));
                            } else if ($is_tag) {
                                $subgroups = wp_get_post_categories($post['id'], array('fields' => 'slugs'));
                            }

                            foreach ($subgroups as $subgroup) {                                
                                if (strtolower(str_replace('-', ' ', $subgroup)) === strtolower(str_replace('-', ' ', $data['name']))) {
                                    continue;
                                }
                                
                                $found = false;
                                foreach ($groupedPosts as &$group) {
                                    if (strtolower($group['name']) === strtolower($subgroup)) {
                                        $group['posts'][] = $post;
                                        $found = true;
                                        break;
                                    }
                                }

                                if (!$found) {
                                    $groupedPosts[] = array(
                                        'name' => $subgroup,
                                        'posts' => array($post)
                                    );
                                }
                            }
                        }

                        echo '<script>var content = ' . json_encode($groupedPosts) . ';</script>';
                        break;
                    case 'galaxy':
                        echo '<div id="3d-graph" style="z-index: -1000;"></div>';
                        echo '<script type="module" src="' . plugin_dir_url(__FILE__) . 'assets/js/galaxy.js"></script>';

                        $groupValues = range(0, count($data['posts']) - 1);

                        shuffle($groupValues);

                        $links = array();
                        foreach ($data['posts'] as $post) {
                            $node = array(
                                'id' => $post['title'],
                                'group' => array_pop($groupValues),
                                'content' => $post['content'],
                                'url' => get_permalink($post['id'])
                            );
                            $nodes[] = $node;

                            if (isset($post['links'])) {
                                foreach ($post['links'] as $link) {
                                    $linkNode = array(
                                        'source' => $post['title'],
                                        'target' => get_the_title(url_to_postid($link)),
                                    );
                                    $links[] = $linkNode;
                                }
                            }
                        }

                        $graphData = array(
                            'nodes' => $nodes,
                            'links' => $links
                        );

                        $jsonData = json_encode($graphData);
                        file_put_contents(plugin_dir_path(__FILE__) . 'assets/galaxy-nodes.json', $jsonData);

                        echo '<script>var content = ' . json_encode($data['posts']) . ';</script>';
                        break;
                }
            }
?>
        </body>
    </html>
<?php
    exit;
}

function add_default_url_params() {
    if (is_admin() || !is_singular() && !is_category() && !is_tag())
        return;

    global $wp;
    $current_url = home_url($wp->request);
    $current_query_params = $_GET;


    if (!isset($current_query_params['3Denabled']) || $current_query_params['3Denabled'] === 'false')
        return;

    $params = array(
        '3Denabled' => 'true',
        '3Dtype' => '',
        'interaction' => ''
    );

    if (is_singular()) {
        $params['3Dtype'] = 'pointAndClick';
        $params['interaction'] = get_post_meta(get_the_ID(), '_interaction_option', true) ?: 'orbitControls';
    } elseif (is_category() || is_tag()) {
        $params['3Dtype'] = get_term_meta(get_queried_object_id(), '_environment_option', true) ?: 'armoire';
        $params['interaction'] = get_term_meta(get_queried_object_id(), '_interaction_option', true) ?: 'orbitControls';
    }

    if ($params['3Dtype'] === 'galaxy')
        $params['interaction'] = 'orbitControls';

    $new_params = array_merge($params, $current_query_params);

    if ($new_params !== $current_query_params) {
        wp_redirect(add_query_arg($new_params, $current_url));
        exit;
    }
}
add_action('template_redirect', 'add_default_url_params');

function add_meta_boxes() {
    add_meta_box(
        'post_interaction_meta_box_id',
        __('Interacción 3D', 'myplugin'),
        'post_interaction_meta_box_callback',
        'post',
        'side'
    );

    add_meta_box(
        'taxonomy_interaction_meta_box_id',
        __('Interacción 3D', 'myplugin'),
        'taxonomy_interaction_meta_box_callback',
        array('category', 'post_tag'),
        'side'
    );

    add_meta_box(
        'taxonomy_environment_meta_box_id',
        __('Entorno 3D', 'myplugin'),
        'taxonomy_environment_meta_box_callback',
        array('category', 'post_tag'),
        'side'
    );
}
add_action('add_meta_boxes', 'add_meta_boxes');

function post_interaction_meta_box_callback($post) {
    $selected = get_post_meta($post->ID, '_interaction_option', true);
    wp_nonce_field('save_post_interaction_meta_box_data', 'post_interaction_meta_box_nonce');
    ?>
    <select name="interaction_option" id="interaction_option">
        <option value="orbitControls" <?php selected($selected, 'orbitControls'); ?>>Controles de órbita</option>
        <option value="deviceOrientationControls" <?php selected($selected, 'deviceOrientationControls'); ?>>Controles de orientación</option>
    </select>
    <?php
}

function save_post_interaction_data($post_id) {
    if (!isset($_POST['post_interaction_meta_box_nonce']) || 
        !wp_verify_nonce($_POST['post_interaction_meta_box_nonce'], 'save_post_interaction_meta_box_data')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    if (isset($_POST['interaction_option'])) {
        update_post_meta($post_id, '_interaction_option', sanitize_text_field($_POST['interaction_option']));
    }
}
add_action('save_post', 'save_post_interaction_data');

function taxonomy_interaction_meta_box_callback($term = null) {
    $selectedInteraction = '';
    if ($term) {
        if (is_object($term)) {
            $selectedInteraction = get_term_meta($term->term_id, '_interaction_option', true);
        } elseif (is_int($term)) {
            $selectedInteraction = get_term_meta($term, '_interaction_option', true);
        }
    }
    wp_nonce_field('save_taxonomy_interaction_meta_box_data', 'taxonomy_interaction_meta_box_nonce');
    ?>
    <tr class="form-field">
        <th scope="row" valign="top">
            <label for="interaction_option"><?php _e('Interacción 3D', 'myplugin'); ?></label>
        </th>
        <td>
            <select name="interaction_option" id="interaction_option" class="postbox">
                <option value="orbitControls" <?php selected($selectedInteraction, 'orbitControls'); ?>>Controles de órbita</option>
                <option value="deviceOrientationControls" <?php selected($selectedInteraction, 'deviceOrientationControls'); ?>>Controles de orientación</option>
            </select>
        </td>
    </tr>
    <?php
}
add_action('category_add_form_fields', 'taxonomy_interaction_meta_box_callback');
add_action('category_edit_form_fields', 'taxonomy_interaction_meta_box_callback');
add_action('post_tag_add_form_fields', 'taxonomy_interaction_meta_box_callback');
add_action('post_tag_edit_form_fields', 'taxonomy_interaction_meta_box_callback');

function taxonomy_environment_meta_box_callback($term = null) {
    $selectedEnvironment = '';
    if ($term) {
        if (is_object($term)) {
            $selectedEnvironment = get_term_meta($term->term_id, '_environment_option', true);
        } elseif (is_int($term)) {
            $selectedEnvironment = get_term_meta($term, '_environment_option', true);
        }
    }
    wp_nonce_field('save_taxonomy_environment_meta_box_data', 'taxonomy_environment_meta_box_nonce');
    ?>
    <tr class="form-field">
        <th scope="row" valign="top">
            <label for="environment_option"><?php _e('Entorno 3D', 'myplugin'); ?></label>
        </th>
        <td>
            <select name="environment_option" id="environment_option" class="postbox">
                <option value="armoire" <?php selected($selectedEnvironment, 'armoire'); ?>>Armería</option>
                <option value="museum" <?php selected($selectedEnvironment, 'museum'); ?>>Museo</option>
                <option value="galaxy" <?php selected($selectedEnvironment, 'galaxy'); ?>>Galaxia</option>
            </select>
        </td>
    </tr>
    <?php
}
add_action('category_add_form_fields', 'taxonomy_environment_meta_box_callback');
add_action('category_edit_form_fields', 'taxonomy_environment_meta_box_callback');
add_action('post_tag_add_form_fields', 'taxonomy_environment_meta_box_callback');
add_action('post_tag_edit_form_fields', 'taxonomy_environment_meta_box_callback');

function save_taxonomy_interaction_data($term_id) {
    if (!isset($_POST['taxonomy_interaction_meta_box_nonce']) || 
        !wp_verify_nonce($_POST['taxonomy_interaction_meta_box_nonce'], 'save_taxonomy_interaction_meta_box_data')) {
        return;
    }

    if (!current_user_can('edit_term', $term_id)) {
        return;
    }

    if (isset($_POST['interaction_option'])) {
        update_term_meta($term_id, '_interaction_option', sanitize_text_field($_POST['interaction_option']));
    }
}
add_action('edit_category', 'save_taxonomy_interaction_data');
add_action('edit_post_tag', 'save_taxonomy_interaction_data');
add_action('create_category', 'save_taxonomy_interaction_data');
add_action('create_post_tag', 'save_taxonomy_interaction_data');

function save_taxonomy_environment_data($term_id) {
    if (!isset($_POST['taxonomy_environment_meta_box_nonce']) || 
        !wp_verify_nonce($_POST['taxonomy_environment_meta_box_nonce'], 'save_taxonomy_environment_meta_box_data')) {
        return;
    }

    if (!current_user_can('edit_term', $term_id)) {
        return;
    }

    if (isset($_POST['environment_option'])) {
        update_term_meta($term_id, '_environment_option', sanitize_text_field($_POST['environment_option']));
    }
}
add_action('edit_category', 'save_taxonomy_environment_data');
add_action('edit_post_tag', 'save_taxonomy_environment_data');
add_action('create_category', 'save_taxonomy_environment_data');
add_action('create_post_tag', 'save_taxonomy_environment_data');

?>