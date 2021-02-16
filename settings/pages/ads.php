<?php 
	$page = getCurrentPage();
	$pageAction = getUrlParams('a', 'string');
	$adId = getUrlParams('i', 'string');

	switch ($pageAction) {
		case 'e':
			$page->setPageTitle('Ad edit');
			break;
		case 'n':
			$page->setPageTitle('New ad');
			break;
		default:
			$page->setPageTitle('Ads');
			break;
	}

?>
	<div class="row">
		<div class="col-10 page_title_block">
			<?php
				if ($page) {
					echo $page->getPageTitle();
				}
			?>
		</div>
		<div class="col-2 text-end">
			<?php 
				if (empty($pageAction)) { 
			?>
					<a href="?page=<?= $page->getPageCode(); ?>&a=n" class="btn btn-success">Add</a>
			<?php 
				} 
			?>
		</div>
	</div>
	<div class="row">
		<div class="col-12">
			<?php 
				if ($pageAction) {
					switch ($pageAction) {
						case 'n':
							showForm();
							break;
						case 'e':
							if ($adData = getAdData((int) $adId)) {
								showForm($adData);
							}

							break;
						default:
							# code...
							break;
					}
				} else {
					$pageData = getPageData($page->getPageCode());
				}
			?>

			<table class="table">
				<thead>
					<th>ID</th>
					<th>Name</th>
					<th>Code</th>
					<th>Media</th>
					<th></th>
				</thead>
				<tbody>
					<tr>
						<td>1</td>
						<td>Example ad</td>
						<td>example_ad</td>
						<td>media</td>
						<td>Edit/Delete</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

<?php

function showForm() {
	?>
		<form id="adsForm">
			<div class="row">
				<div class="col-10">
					<div class="row">
						<div class="col-6">
				  			<label for="adsName">Name</label>
				  			<input type="text" id="adsName" class="form-control" aria-describedby="adsNameHelpInline">
				  			<span id="adsNameHelpInline" class="form-text">Must be 50 characters long.</span>
				  		</div>
				  		<div class="col-6">
				  			<label for="adsCode">Code</label>
				  			<input type="text" id="adsCode" class="form-control" aria-describedby="adsCodeHelpInline">
				  			<span id="adsCodeHelpInline" class="form-text">Must be 255 characters long.</span>
				  		</div>
				  		<div class="col-12">
				  			<label for="adsUrl">URL</label>
				  			<input type="text" id="adsUrl" class="form-control" aria-describedby="adsUrlHelpInline">
				  			<span id="adsUrlHelpInline" class="form-text">
				  				Example: 
				  				<a target="_blank" href="https://storage.googleapis.com/gvabox/external_sample/vpaid2jsnonlinear.xml">https://storage.googleapis.com/gvabox/external_sample/vpaid2jsnonlinear.xml</a>
				  			</span>
				  		</div>
				  		<div class="col-12">
				  			<label for="adsComments">Comments</label>
				  			<textarea class="form-control" id="adsComments"></textarea>
			  			</div>
						<div class="col-6">
				  			<label for="adsType">Type</label>
				  			<select class="form-select form-select" aria-label=".form-select" id="adsType">
				  				<option>ads types</option>
				  			</select>
				  		</div>

				  		<div class="col-6">
				  			<label for="adsOffset">Offset</label>
				  			<input type="text" id="adsOffset" class="form-control" aria-describedby="adsOffsetHelpInline">
				  			<span id="adsOffsetHelpInline" class="form-text">Value must be in seconds</span>
				  		</div>

				  		<div class="col-6">
				  			<label for="adsMaxAds">Maximum ads</label>
				  			<input type="text" id="adsMaxAds" class="form-control" aria-describedby="adsMaxAdsHelpInline">
				  			<span id="adsMaxAdsHelpInline" class="form-text">Value must be integer</span>
				  		</div>
					</div>
					<div class="row">
						<div class="col-6">
							<div class="form-check form-switch">
							  	<input class="form-check-input" type="checkbox" id="adsStatus" checked>
							  	<label class="form-check-label" for="adsStatus">Enabled</label>
							</div>
						</div>
						<div class="col-6 text-end">
							<button type="submit" class="btn btn-success">Add</button>
						</div>
					</div>
				</div>
			</div>
		</form>

		<script type="text/javascript">
			$('#adsForm').submit(function(event) {
				event.preventDefault();

				var formData = {
					'name': $('#adsName').val(),
					'code': $('#adsCode').val(),
					'url': $('#adsUrl').val(),
					'comments': $('#adsComments').val(),
					'type': $('#adsType').val(),
					'offset': $('#adsOffset').val(),
					'maxAds': $('#adsMaxAds').val(),
					'status': $('#adsStatus').val()
				};

				$.ajax({
					type: "POST",
					url: "/vplayer/settings/controllers/ajax_ads_controller.php?a=n",
					data: {
						'formData': formData
					},
					success: function(response) {
						console.log(response);
					}
				})
			});
		</script>
	<?php
}