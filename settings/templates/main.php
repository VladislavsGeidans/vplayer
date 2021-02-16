<div class="col-10 main-block">
	<div class="row">
		<div class="col-12">
			<?php
				if ($page = getUrlParams('page', 'string')) {
					if (in_array($page, $globalPageCodes)) {
						if (file_exists('pages/' . $page . '.php')) {
							include_once('pages/' . $page . '.php');
						} else {
							getAccessDenied();
						}
					} else {
						getAccessDenied();
					}
				} else {
					getAccessDenied();
				}
			?>
		</div>
	</div>
</div>