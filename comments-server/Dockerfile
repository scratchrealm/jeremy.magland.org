FROM ghcr.io/isso-comments/isso:release

# The base image declares /config as a volume, so keep the config elsewhere.
COPY isso.cfg /etc/isso/isso.cfg
ENV ISSO_SETTINGS=/etc/isso/isso.cfg

# Same command as the base image, but refuse to start if the admin password
# secret is missing (Isso would otherwise accept the unexpanded placeholder
# from isso.cfg as the password).
ENTRYPOINT ["/bin/sh", "-c", "if [ -z \"$ISSO_ADMIN_PASSWORD\" ]; then echo 'ISSO_ADMIN_PASSWORD is not set' >&2; exit 1; fi; exec /isso/bin/gunicorn -b 0.0.0.0:8080 -w 4 --preload --worker-tmp-dir /dev/shm \"$@\"", "sh"]
CMD ["isso.run"]
