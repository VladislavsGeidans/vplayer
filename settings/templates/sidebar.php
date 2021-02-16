<div class="col-2 sidebar_block">
	<ul class="list-group list-group-flush">
		<?php
			foreach($globalPages as $page) {
				?>
					<a href="?page=<?= $page->getPageCode(); ?>" class="<?= isActivePage($page->getPageCode()); ?>">
						<li class="list-group-item">
							<?= $page->getPageName(); ?>
						</li>
					</a>
				<?php
			}
		?>
	</ul>
</div>